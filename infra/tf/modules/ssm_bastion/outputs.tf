output "bastion_id" {
  value       = aws_instance.bastion.id
  description = "ID of the bastion host"
}

output "bastion_security_group_id" {
  value       = aws_security_group.bastion.id
  description = "ID of the bastion security group"
}

output "bastion_instance_name" {
  value       = "${var.name_prefix}-bastion"
  description = "Name of the bastion instance (for use with SSM)"
}
