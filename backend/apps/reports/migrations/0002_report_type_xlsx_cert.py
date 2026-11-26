from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("reports", "0001_initial"),
    ]

    operations = [
        migrations.AlterField(
            model_name="report",
            name="report_type",
            field=models.CharField(
                choices=[
                    ("PDF", "PDF"),
                    ("CSV", "CSV"),
                    ("XLSX", "Excel workbook"),
                    ("CERT", "Certificate (PDF)"),
                ],
                max_length=8,
            ),
        ),
    ]
