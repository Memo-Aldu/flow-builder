output "api_url" {
  value = aws_lb.api.dns_name
}

output "queue_url" {
  value = module.workflow_queue.queue_url
}

output "db_endpoint" {
  value = module.db.db_instance_endpoint
}