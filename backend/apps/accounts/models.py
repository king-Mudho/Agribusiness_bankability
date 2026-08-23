from django.contrib.auth.models import AbstractUser
from django.db import models


class Role(models.Model):
    ADMIN = "ADMIN"
    RESEARCHER = "RESEARCHER"
    DATA_COLLECTOR = "DATA_COLLECTOR"
    ANALYST = "ANALYST"
    VIEWER = "VIEWER"

    NAME_CHOICES = [
        (ADMIN, "Admin"),
        (RESEARCHER, "Researcher"),
        (DATA_COLLECTOR, "Data Collector"),
        (ANALYST, "Analyst"),
        (VIEWER, "Viewer"),
    ]

    name = models.CharField(max_length=32, choices=NAME_CHOICES, unique=True)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name


class User(AbstractUser):
    role = models.ForeignKey(
        Role, on_delete=models.SET_NULL, null=True, blank=True, related_name="users"
    )
    phone = models.CharField(max_length=32, blank=True)

    def __str__(self):
        return self.username
