#!/bin/bash
# ============================================================================
# Create Pilot Customer Script for UnMoGrowP Attribution Platform
# Automates pilot customer onboarding process
# ============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

echo -e "${PURPLE}🚀 UnMoGrowP Pilot Customer Onboarding${NC}"
echo "================================================"

# Configuration
METRICS_API=${METRICS_API:-"http://localhost:8084"}
PLATFORM_API=${PLATFORM_API:-"http://localhost:8080"}

# Function to validate input
validate_input() {
    local input=$1
    local field=$2

    if [ -z "$input" ]; then
        echo -e "${RED}❌ $field is required${NC}"
        return 1
    fi
    return 0
}

# Function to generate customer ID
generate_customer_id() {
    local company_name=$1
    echo "${company_name,,}" | sed 's/[^a-z0-9]/-/g' | sed 's/--*/-/g' | sed 's/^-\|-$//g'
}

# Function to create customer in metrics system
create_customer_metrics() {
    local customer_id=$1
    local company_name=$2

    echo -e "${BLUE}📊 Creating customer in metrics system...${NC}"

    local payload=$(cat <<EOF
{
    "customer_id": "$customer_id",
    "company_name": "$company_name"
}
EOF
)

    local response=$(curl -s -X POST "$METRICS_API/v1/customers" \
        -H "Content-Type: application/json" \
        -d "$payload")

    if echo "$response" | grep -q '"customer_id"'; then
        echo -e "${GREEN}✅ Customer metrics created successfully${NC}"
        return 0
    else
        echo -e "${RED}❌ Failed to create customer metrics: $response${NC}"
        return 1
    fi
}

# Function to generate API keys
generate_api_keys() {
    local customer_id=$1

    echo -e "${BLUE}🔑 Generating API keys for $customer_id...${NC}"

    # Generate production and staging keys
    local prod_key="prod_${customer_id}_$(openssl rand -hex 16)"
    local staging_key="staging_${customer_id}_$(openssl rand -hex 16)"

    echo -e "${GREEN}✅ API Keys Generated:${NC}"
    echo "  Production: $prod_key"
    echo "  Staging: $staging_key"

    # Store keys in environment file
    local env_file="pilot-customers/${customer_id}/.env"
    mkdir -p "pilot-customers/${customer_id}"

    cat > "$env_file" << EOF
# UnMoGrowP Attribution Platform - Pilot Customer Environment
# Customer: $customer_id
# Generated: $(date)

# API Keys
UNMOGROWP_PROD_API_KEY=$prod_key
UNMOGROWP_STAGING_API_KEY=$staging_key

# Endpoints
UNMOGROWP_PROD_URL=https://api.attribution.unmogrowp.com
UNMOGROWP_STAGING_URL=https://staging.attribution.unmogrowp.com

# SDK Configuration
UNMOGROWP_ATTRIBUTION_WINDOW=168  # 7 days in hours
UNMOGROWP_DEFAULT_MODEL=last_touch
UNMOGROWP_ENVIRONMENT=production
EOF

    echo -e "${GREEN}✅ Environment file created: $env_file${NC}"
    return 0
}

# Function to create customer directory structure
create_customer_directory() {
    local customer_id=$1
    local company_name=$2

    echo -e "${BLUE}📁 Creating customer directory structure...${NC}"

    local customer_dir="pilot-customers/${customer_id}"

    # Create directory structure
    mkdir -p "$customer_dir/docs"
    mkdir -p "$customer_dir/integration"
    mkdir -p "$customer_dir/tests"
    mkdir -p "$customer_dir/support"

    # Create customer README
    cat > "$customer_dir/README.md" << EOF
# $company_name - UnMoGrowP Attribution Platform Pilot

**Customer ID**: $customer_id
**Company**: $company_name
**Pilot Start**: $(date +%Y-%m-%d)
**Status**: Discovery Phase

---

## 📋 Pilot Progress

### Phase 1: Discovery (Week 1)
- [ ] Initial consultation completed
- [ ] Technical assessment done
- [ ] Integration plan approved
- [ ] Success metrics defined

### Phase 2: Setup (Week 2)
- [ ] Account provisioned
- [ ] SDK integration started
- [ ] Test events flowing
- [ ] Data validation passed

### Phase 3: Launch (Week 3)
- [ ] Production deployment
- [ ] Performance validation
- [ ] Success metrics achieved
- [ ] Customer feedback collected

---

## 🔑 Integration Details

**API Keys**: See \`.env\` file
**Documentation**: [Technical Checklist](../../docs/PILOT_TECHNICAL_CHECKLIST.md)
**Support**: Slack #${customer_id}-pilot

---

## 📊 Success Metrics (Targets)

- **Attribution Accuracy**: >99% (vs current solution)
- **API Latency**: <100ms P95
- **System Uptime**: >99.9%
- **Cost Savings**: 30-50% vs current provider
- **Customer Satisfaction**: >90%

---

## 📞 Support Contacts

- **Success Manager**: pilot@unmogrowp.com
- **Technical Support**: Slack #${customer_id}-pilot
- **Engineering**: Direct access via Slack

EOF

    # Create integration checklist
    cat > "$customer_dir/docs/integration-checklist.md" << EOF
# $company_name - Integration Checklist

## Pre-Integration
- [ ] Current attribution setup documented
- [ ] Event volume analyzed: _____ events/day
- [ ] Required attribution models identified
- [ ] Team contacts assigned

## Technical Setup
- [ ] API keys received and stored securely
- [ ] Staging environment access confirmed
- [ ] SDK downloaded and reviewed
- [ ] Test events endpoint verified

## Integration Steps
- [ ] SDK initialized in staging app
- [ ] Install events tracked
- [ ] Purchase events tracked
- [ ] Custom events implemented
- [ ] Attribution callbacks configured

## Validation
- [ ] Events appearing in dashboard
- [ ] Attribution data accurate
- [ ] Performance benchmarks met
- [ ] Error rates acceptable

## Go-Live
- [ ] Production API keys activated
- [ ] Traffic gradually migrated
- [ ] Monitoring alerts configured
- [ ] Success metrics tracked

---

**Support**: Create ticket in \`../support/\` directory or contact Slack #${customer_id}-pilot
EOF

    # Create support template
    cat > "$customer_dir/support/SUPPORT_TEMPLATE.md" << EOF
# Support Request Template

**Date**: $(date +%Y-%m-%d)
**Customer**: $company_name ($customer_id)
**Priority**: [ ] Low [ ] Medium [ ] High [ ] Critical

## Issue Description
[Describe the issue clearly]

## Steps to Reproduce
1.
2.
3.

## Expected Behavior
[What should happen]

## Actual Behavior
[What actually happens]

## Environment
- Platform: [ ] iOS [ ] Android [ ] Web [ ] Server
- SDK Version:
- App Version:
- Integration Type: [ ] SDK [ ] API [ ] Import

## Additional Context
[Screenshots, logs, error messages]

---

**Next Steps**: Assign to engineering team and update in Slack #${customer_id}-pilot
EOF

    echo -e "${GREEN}✅ Customer directory created: $customer_dir${NC}"
    return 0
}

# Function to send welcome email template
create_welcome_email() {
    local customer_id=$1
    local company_name=$2

    echo -e "${BLUE}📧 Creating welcome email template...${NC}"

    local email_file="pilot-customers/${customer_id}/docs/welcome-email.md"

    cat > "$email_file" << EOF
# Welcome to UnMoGrowP Attribution Platform Pilot Program

**Subject**: Welcome to UnMoGrowP - Your Attribution Journey Starts Now! 🚀

---

Dear $company_name team,

Welcome to the UnMoGrowP Attribution Platform Pilot Program! We're excited to help you achieve **10x better attribution performance** with **50% cost savings**.

## 🎯 Your Pilot Program Benefits

✅ **75% Discount** for 6 months
✅ **Dedicated Success Manager**
✅ **Direct Engineering Access**
✅ **Weekly Success Calls**
✅ **Custom Integration Support**

## 🔑 Your Account Details

**Customer ID**: $customer_id
**Dashboard**: https://${customer_id}.attribution.unmogrowp.com
**Staging**: https://${customer_id}-staging.attribution.unmogrowp.com
**Support Slack**: #${customer_id}-pilot

## 📋 Next Steps (Week 1)

1. **Initial Consultation** (60 minutes)
   - Review current attribution setup
   - Define success metrics
   - Plan integration approach

2. **Technical Assessment**
   - Analyze event volume and patterns
   - Review integration requirements
   - Set performance benchmarks

3. **Account Setup**
   - API keys delivery (secure)
   - Team access provisioning
   - Development environment setup

## 📊 Success Targets

- **Attribution Accuracy**: >99% vs your current solution
- **API Performance**: <100ms P95 latency
- **Integration Time**: <2 weeks to go-live
- **Cost Savings**: 30-50% vs current provider

## 📞 Your Success Team

**Success Manager**: [Name] - pilot@unmogrowp.com
**Technical Lead**: [Name] - Slack #${customer_id}-pilot
**Calendar Link**: https://cal.com/unmogrowp/pilot

---

**Ready to get started?**

Reply to this email to schedule your initial consultation, or book directly: https://cal.com/unmogrowp/pilot

We're here to ensure your pilot program is a complete success!

Best regards,
The UnMoGrowP Team

---
*P.S. Join our Slack channel #${customer_id}-pilot for instant engineering support*
EOF

    echo -e "${GREEN}✅ Welcome email template created: $email_file${NC}"
    return 0
}

# Main onboarding function
onboard_customer() {
    echo -e "${YELLOW}📝 Gathering customer information...${NC}"

    # Get customer information
    read -p "Company Name: " company_name
    validate_input "$company_name" "Company Name" || return 1

    read -p "Primary Contact Name: " contact_name
    validate_input "$contact_name" "Contact Name" || return 1

    read -p "Primary Contact Email: " contact_email
    validate_input "$contact_email" "Contact Email" || return 1

    read -p "Current Attribution Provider (optional): " current_provider
    read -p "Daily Event Volume (optional): " event_volume

    # Generate customer ID
    customer_id=$(generate_customer_id "$company_name")

    echo ""
    echo -e "${BLUE}📋 Customer Summary:${NC}"
    echo "  Customer ID: $customer_id"
    echo "  Company: $company_name"
    echo "  Contact: $contact_name <$contact_email>"
    echo "  Current Provider: ${current_provider:-'Not specified'}"
    echo "  Event Volume: ${event_volume:-'To be determined'}"
    echo ""

    read -p "Continue with onboarding? (y/N): " -n 1 -r
    echo

    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${YELLOW}⏸️  Onboarding cancelled${NC}"
        return 0
    fi

    echo -e "${GREEN}🚀 Starting customer onboarding...${NC}"

    # Execute onboarding steps
    if create_customer_metrics "$customer_id" "$company_name" &&
       create_customer_directory "$customer_id" "$company_name" &&
       generate_api_keys "$customer_id" &&
       create_welcome_email "$customer_id" "$company_name"; then

        echo ""
        echo -e "${GREEN}🎉 Customer onboarding completed successfully!${NC}"
        echo "================================================"
        echo -e "${BLUE}📁 Customer Directory:${NC} pilot-customers/$customer_id/"
        echo -e "${BLUE}📧 Welcome Email:${NC} pilot-customers/$customer_id/docs/welcome-email.md"
        echo -e "${BLUE}🔑 API Keys:${NC} pilot-customers/$customer_id/.env"
        echo -e "${BLUE}📊 Metrics Tracking:${NC} http://localhost:8084/v1/customers/$customer_id"
        echo ""
        echo -e "${YELLOW}📋 Next Steps:${NC}"
        echo "1. Send welcome email to $contact_email"
        echo "2. Create Slack channel: #${customer_id}-pilot"
        echo "3. Schedule initial consultation"
        echo "4. Begin Week 1 discovery phase"
        echo ""
        echo -e "${GREEN}✅ Customer ready for pilot program!${NC}"

    else
        echo -e "${RED}❌ Customer onboarding failed${NC}"
        return 1
    fi
}

# Check prerequisites
check_prerequisites() {
    echo -e "${BLUE}🔍 Checking prerequisites...${NC}"

    # Check if metrics API is running
    if ! curl -s -f "$METRICS_API/health" > /dev/null 2>&1; then
        echo -e "${RED}❌ Metrics API is not running at $METRICS_API${NC}"
        echo "   Start with: go run services/metrics/customer-success-tracker.go"
        return 1
    fi

    # Check if platform API is running
    if ! curl -s -f "$PLATFORM_API/health" > /dev/null 2>&1; then
        echo -e "${YELLOW}⚠️  Platform API is not running at $PLATFORM_API${NC}"
        echo "   This is optional but recommended"
    fi

    echo -e "${GREEN}✅ Prerequisites checked${NC}"
    return 0
}

# Main execution
main() {
    if ! check_prerequisites; then
        exit 1
    fi

    onboard_customer
}

# Run main function
main "$@"