# NAT Instance vs NAT Gateway

This infrastructure uses a NAT Instance instead of a NAT Gateway for cost optimization in development environments.

## Comparison

| Feature | NAT Instance | NAT Gateway |
|---------|-------------|-------------|
| Cost | Lower - only pay for EC2 instance | Higher - hourly charge + data processing fees |
| Maintenance | Self-managed | Fully managed by AWS |
| Availability | Single point of failure unless HA configured | Highly available by default |
| Performance | Limited by instance type | Scales automatically up to 45 Gbps |
| Security patching | Manual | Automatic |

## Cost Savings

For a development environment with low traffic:

- **NAT Gateway**: ~$32/month + data processing fees
- **NAT Instance** (t3.nano): ~$3.80/month + minimal data processing fees

This represents approximately 88% cost savings for development environments.

## Implementation Details

The NAT Instance is:

1. Deployed in a public subnet with a public IP
2. Configured with source/destination check disabled
3. Set up with proper security groups to allow traffic from private subnets
4. Configured with IP forwarding and iptables rules for NAT functionality
5. Used as the target for the default route (0.0.0.0/0) in private subnet route tables
6. Managed by SSM for easy administration without SSH access
7. Monitored by CloudWatch with automatic recovery

## Configuration Options

The following variables control the NAT setup:

```terraform
# Use NAT Gateway (more expensive, fully managed)
enable_nat_gateway = false
single_nat_gateway = true  # Only create one NAT Gateway for all AZs

# Use NAT Instance (cheaper, self-managed)
enable_nat_instance = true
nat_instance_type = "t3.nano"  # Instance type for the NAT instance
```

## Environment-Specific Settings

- **Development**: Uses NAT Instance for cost savings
- **Staging/Production**: Should use NAT Gateway for reliability

## Monitoring and Maintenance

For NAT Instances:

1. Monitor the instance health using CloudWatch (already configured)
2. Auto-recovery is set up to automatically recover the instance if it fails status checks
3. SSM is configured for easy management and patching without SSH access
4. Consider implementing an Auto Scaling Group for higher availability in production
5. Apply security patches regularly using SSM

## Limitations

When using a NAT Instance:

1. Single point of failure unless HA is configured
2. Limited bandwidth based on instance type
3. Requires manual maintenance and updates
4. May experience performance issues under high load
