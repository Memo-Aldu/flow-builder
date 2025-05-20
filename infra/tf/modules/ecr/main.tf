resource "aws_ecr_repository" "this" {
  for_each = toset(var.repositories)
  name     = each.value
  image_scanning_configuration {
    scan_on_push = true
  }
  encryption_configuration {
    encryption_type = "AES256"
  }
  tags = merge(var.tags, { Name = each.value })
}

output "repository_urls" {
  value = { for k, v in aws_ecr_repository.this : k => v.repository_url }
}