# Get VPC information from subnet IDs
data "aws_vpc" "selected" {
  filter {
    name   = "vpc-id"
    values = [data.aws_subnet.first_subnet.vpc_id]
  }
}

data "aws_subnet" "first_subnet" {
  id = var.subnet_ids[0]
}

module "service" {
  source  = "terraform-aws-modules/ecs/aws//modules/service"
  version = "5.7.0"

  name        = var.name
  cluster_arn = var.cluster_arn
  cpu         = var.cpu
  memory      = var.memory
  desired_count = var.desired_count

  container_definitions = {
    "${var.name}" = {
      name      = var.name
      image     = var.image
      essential = true
      port_mappings = [{
        containerPort = var.container_port
        hostPort      = var.container_port
      }]
      environment = [for k, v in var.env_vars : {
        name  = k
        value = v
      }]
      log_configuration = {
        logDriver = "awslogs"
        options = {
          "awslogs-region"        = var.aws_region
          "awslogs-group"         = "/ecs/${var.name}"
          "awslogs-stream-prefix" = "ecs"
        }
      }
    }
  }

  load_balancer = var.create_load_balancer ? [{
    target_group_arn = aws_lb_target_group.tg[0].arn
    container_name   = var.name
    container_port   = var.container_port
  }] : []

  subnet_ids = var.subnet_ids
  tags       = var.tags
}

resource "aws_lb_target_group" "tg" {
  count       = var.create_load_balancer ? 1 : 0
  name        = "tg-${var.name}"
  port        = var.container_port
  protocol    = "HTTP"
  vpc_id      = data.aws_vpc.selected.id
  target_type = "ip"
  health_check {
    path                = "/health"
    matcher             = "200"
    interval            = 30
    unhealthy_threshold = 3
  }
  tags = var.tags
}

resource "aws_lb_listener_rule" "rule" {
  count             = var.create_load_balancer ? 1 : 0
  listener_arn      = var.alb_listener_arn
  priority          = 100 + count.index
  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.tg[0].arn
  }
  condition {
    path_pattern {
      values = ["/*"]
    }
  }
}

output "service_autoscaling_resource_id" {
  value = "service/${var.cluster_arn}/${var.name}"
}

output "lb_dns_name" {
  value = null
}