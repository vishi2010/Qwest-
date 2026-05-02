import uuid
from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from database import get_db
from auth_utils import get_current_user
from vision_service import verify_quest_image, check_vision_service_health, VISION_PROVIDER
import models, schemas

router = APIRouter()

UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp", "image/heic"}
MAX_MB = 10

# CRITICAL: /my MUST be defined BEFORE /{quest_id}
# FastAPI matches routes top-to-bottom. If /{quest_id} is first,
# "my" gets parsed as an integer and returns a 422 error.
@router.get("/my", response_model=list[schemas.SubmissionOut])
def my_submissions(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    return (
        db.query(models.Submission)
        .filter(models.Submission.user_id == current_user.id)
        .order_by(models.Submission.submitted_at.desc())
        .all()
    )

@router.post("/{quest_id}", response_model=schemas.SubmissionOut, status_code=201)
async def submit_quest(
    quest_id: int,
    photo: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    quest = db.query(models.Quest).filter(models.Quest.id == quest_id, models.Quest.is_active == True).first()
    if not quest:
        raise HTTPException(status_code=404, detail="Quest not found or inactive")

    already_done = db.query(models.Submission).filter(
        models.Submission.user_id == current_user.id,
        models.Submission.quest_id == quest_id,
        models.Submission.verified == True,
    ).first()
    if already_done:
        raise HTTPException(status_code=409, detail="Quest already completed")

    if photo.content_type not in ALLOWED_TYPES:
        raise HTTPException(status_code=415, detail=f"Unsupported image type: {photo.content_type}")

    contents = await photo.read()
    if len(contents) > MAX_MB * 1024 * 1024:
        raise HTTPException(status_code=413, detail=f"Image too large (max {MAX_MB}MB)")

    ext = photo.filename.rsplit(".", 1)[-1] if "." in photo.filename else "jpg"
    filename = f"{current_user.id}_{quest_id}_{uuid.uuid4().hex}.{ext}"
    image_path = UPLOAD_DIR / filename
    with open(image_path, "wb") as f:
        f.write(contents)

    if not await check_vision_service_health():
        submission = models.Submission(
            user_id=current_user.id,
            quest_id=quest_id,
            image_path=str(image_path),
            vision_response=f"Vision service ({VISION_PROVIDER}) unavailable - pending manual review",
            verified=False,
            points_awarded=0,
        )
        db.add(submission)
        db.commit()
        db.refresh(submission)
        return submission

    try:
        verified, vision_response = await verify_quest_image(str(image_path), quest.vision_prompt)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Vision check failed: {str(e)}")

    points_awarded = quest.points if verified else 0
    submission = models.Submission(
        user_id=current_user.id,
        quest_id=quest_id,
        image_path=str(image_path),
        vision_response=vision_response,
        verified=verified,
        points_awarded=points_awarded,
    )
    db.add(submission)
    if verified:
        current_user.total_points += points_awarded
    db.commit()
    db.refresh(submission)
    return submission
