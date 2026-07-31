"""Pydantic request models for the Golf Evidence API."""
from pydantic import BaseModel


class CheckNameRequest(BaseModel):
    account_name: str


class RegisterAccountRequest(BaseModel):
    account_name: str


class UpdateAccountRequest(BaseModel):
    account_name: str


class HoleInput(BaseModel):
    hole_number: int
    award_type: str


class CreateCompetitionRequest(BaseModel):
    name: str
    date: str
    course_name: str | None = None
    holes: list[HoleInput] | None = None


class UpdateCompetitionRequest(BaseModel):
    name: str | None = None
    date: str | None = None
    course_name: str | None = None
    status: str | None = None
    holes: list[HoleInput] | None = None


class RequestRepresentativeRequest(BaseModel):
    target_device_id: str | None = None


class UpdateRepresentativeRequest(BaseModel):
    status: str


class ExecuteTransferRequest(BaseModel):
    code: str
