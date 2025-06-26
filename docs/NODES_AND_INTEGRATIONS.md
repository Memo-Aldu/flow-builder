# Workflow Nodes and Integrations

This document provides comprehensive documentation of all available workflow node types, their capabilities, credit costs, and integration details.

## Node Categories

Flow Builder provides a rich library of workflow nodes organized into the following categories:

### Browser Automation
- **Standard Browser**: Basic browser automation
- **Stealth Browser**: Anti-detection browser with stealth features
- **Bright Data Browser**: Enterprise browser with automatic captcha solving
- **Fill Input**: Form field automation
- **Click Element**: Element interaction
- **Wait for Element**: Element waiting and synchronization

### Data Extraction
- **Get HTML**: Page content extraction
- **Get Text from HTML**: CSS selector-based text extraction
- **Condense HTML**: HTML optimization and cleanup
- **OpenAI Data Extraction**: AI-powered intelligent data extraction

### Data Processing
- **JSON Transform**: Data transformation and manipulation
- **Merge Data**: Combine data from multiple sources
- **Read Property from JSON**: Extract specific JSON properties
- **Write Property to JSON**: Update JSON data structures

### Flow Control
- **Branch**: Conditional workflow execution
- **Delay**: Time-based delays
- **Wait for Element**: Element-based synchronization

### Communication & Delivery
- **Webhook Delivery**: HTTP webhook integration
- **Email Delivery**: SMTP email sending
- **SMS Delivery**: Twilio SMS integration

## Browser Automation Nodes

### Standard Browser Node

**Purpose**: Basic browser automation for simple web interactions.

**Credit Cost**: 5 credits

**Capabilities**:
- Standard Chromium browser with default settings
- Basic popup handling
- Standard user agent and fingerprinting
- Suitable for non-protected websites

**Configuration**:
```json
{
  "type": "launch_standard_browser",
  "inputs": {
    "Website URL": "https://example.com"
  },
  "outputs": ["Web Page"]
}
```

**Use Cases**:
- Simple web scraping
- Basic form automation
- Testing and development
- Non-protected websites

### Stealth Browser Node

**Purpose**: Advanced browser automation with anti-detection measures.

**Credit Cost**: 6 credits

**Anti-Detection Features**:
- **User Agent Randomization**: Rotates between realistic user agents
- **Viewport Randomization**: Random screen resolutions and device types
- **JavaScript Injection**: Hides automation indicators
- **Human-like Behavior**: Random delays and mouse movements
- **Popup Management**: Intelligent popup and modal handling
- **Fingerprint Masking**: Reduces browser fingerprinting

**Configuration**:
```json
{
  "type": "launch_stealth_browser",
  "inputs": {
    "Website URL": "https://protected-site.com"
  },
  "outputs": ["Web Page"]
}
```

**Stealth Techniques**:
```javascript
// Injected JavaScript to hide automation
Object.defineProperty(navigator, 'webdriver', {
  get: () => undefined,
});

// Hide Chrome automation extensions
window.chrome = {
  runtime: {},
};

// Randomize canvas fingerprinting
const getContext = HTMLCanvasElement.prototype.getContext;
HTMLCanvasElement.prototype.getContext = function(type) {
  if (type === '2d') {
    const context = getContext.call(this, type);
    const imageData = context.getImageData;
    context.getImageData = function(x, y, w, h) {
      const data = imageData.call(this, x, y, w, h);
      // Add slight noise to prevent fingerprinting
      for (let i = 0; i < data.data.length; i += 4) {
        data.data[i] += Math.floor(Math.random() * 3) - 1;
      }
      return data;
    };
    return context;
  }
  return getContext.call(this, type);
};
```

**Use Cases**:
- Protected websites with basic anti-bot measures
- Social media automation
- E-commerce scraping
- Content aggregation

### Bright Data Browser Node

**Purpose**: Enterprise-grade browser automation with automatic captcha solving and proxy rotation.

**Credit Cost**: 7 credits

**Enterprise Features**:
- **Automatic Captcha Solving**: 
  - Cloudflare Turnstile
  - reCAPTCHA v2 and v3
  - hCaptcha
  - Custom captcha types
- **Proxy Rotation**: Residential proxy network with global coverage
- **Fingerprint Randomization**: Advanced anti-detection measures
- **Automatic Unblocking**: Bypasses common anti-bot systems
- **Request Optimization**: Header management and request patterns

**Configuration**:
```json
{
  "type": "launch_bright_data_browser",
  "inputs": {
    "Website URL": "https://heavily-protected-site.com",
    "Bright Data Browser Username": "your-username",
    "Bright Data Browser Password": "credential-id-uuid"
  },
  "outputs": ["Web Page"]
}
```

**Bright Data Integration**:
- **Endpoint**: Connects to Bright Data's Scraping Browser service
- **Authentication**: Username/password credentials stored securely
- **Proxy Network**: Automatic rotation through residential IPs
- **Success Rate**: 95%+ success rate on protected websites

**Use Cases**:
- Heavily protected websites
- Large-scale data collection
- E-commerce price monitoring
- Social media data extraction
- Financial data scraping

### Form Interaction Nodes

#### Fill Input Node

**Purpose**: Automated form field filling with human-like typing.

**Credit Cost**: 1 credit

**Features**:
- CSS selector-based element targeting
- Human-like typing simulation with random delays
- Support for all input types (text, email, password, etc.)
- Error handling for missing elements

**Configuration**:
```json
{
  "type": "fill_input",
  "inputs": {
    "Selector": "#email-input",
    "Value": "user@example.com",
    "Human-like Typing": true
  },
  "outputs": ["Web Page"]
}
```

#### Click Element Node

**Purpose**: Automated element clicking and interaction.

**Credit Cost**: 1 credit

**Features**:
- CSS selector-based element targeting
- Wait for element visibility
- Scroll to element if needed
- Handle dynamic content loading

**Configuration**:
```json
{
  "type": "click_element",
  "inputs": {
    "Selector": "button[type='submit']"
  },
  "outputs": ["Web Page"]
}
```

## Data Extraction Nodes

### Get HTML Node

**Purpose**: Extract complete HTML content from the current page.

**Credit Cost**: 2 credits

**Features**:
- Full page HTML extraction
- Includes dynamically loaded content
- Preserves page structure and formatting

**Configuration**:
```json
{
  "type": "get_html",
  "inputs": {},
  "outputs": ["Html Content", "Web Page"]
}
```

### Get Text from HTML Node

**Purpose**: Extract specific text content using CSS selectors.

**Credit Cost**: 2 credits

**Features**:
- CSS selector-based text extraction
- Multiple element support
- Text cleaning and formatting
- Error handling for missing elements

**Configuration**:
```json
{
  "type": "get_text_from_html",
  "inputs": {
    "Html": "{{Html Content}}",
    "Selector": ".product-price"
  },
  "outputs": ["Text"]
}
```

### Condense HTML Node

**Purpose**: Optimize HTML by removing unnecessary content.

**Credit Cost**: 2 credits

**Features**:
- Remove scripts and style tags
- Strip comments and metadata
- Preserve essential content structure
- Reduce HTML size for processing

**Configuration**:
```json
{
  "type": "condense_html",
  "inputs": {
    "Html": "{{Html Content}}"
  },
  "outputs": ["Condensed Html"]
}
```

### OpenAI Data Extraction Node

**Purpose**: AI-powered intelligent data extraction from HTML or text content.

**Credit Cost**: 4 credits

**OpenAI Integration**:
- **Model**: GPT-4o-mini for cost efficiency
- **Temperature**: 0.5 for balanced creativity/consistency
- **System Prompt**: Optimized for data extraction tasks
- **Output Format**: Structured JSON data

**Configuration**:
```json
{
  "type": "extract_data_openai",
  "inputs": {
    "API Key": "credential-id-uuid",
    "Prompt": "Extract product names, prices, and availability",
    "Content": "{{Html Content}}"
  },
  "outputs": ["Extracted Data"]
}
```

**System Prompt**:
```
You are a webscraper helper that extracts data from HTML or text. You will be given a piece of text or HTML content as input and also the prompt with the data you have to extract. The response should always be only the extracted data as a JSON array or object, without any additional words or explanations. Analyze the input carefully and extract data precisely based on the prompt. If no data is found, return an empty JSON array. Work only with the provided content and ensure the output is always a valid JSON array without surrounding text.
```

**Example Usage**:
- **Input**: HTML containing product listings
- **Prompt**: "Extract product name, price, and stock status"
- **Output**: 
```json
[
  {
    "name": "Wireless Headphones",
    "price": "$99.99",
    "stock": "In Stock"
  },
  {
    "name": "Bluetooth Speaker",
    "price": "$49.99", 
    "stock": "Out of Stock"
  }
]
```

## Communication & Delivery Nodes

### Webhook Delivery Node

**Purpose**: Send data to external systems via HTTP webhooks.

**Credit Cost**: 2 credits

**Features**:
- Support for GET, POST, PUT, PATCH methods
- Custom headers and authentication
- JSON and form-encoded payloads
- Error handling and retry logic

**Configuration**:
```json
{
  "type": "deliver_to_webhook",
  "inputs": {
    "Webhook URL": "https://api.example.com/webhook",
    "Payload": "{{Extracted Data}}",
    "Content Type": "application/json",
    "Authorization Type": "bearer",
    "Authorization Value": "your-api-token"
  },
  "outputs": ["Delivery Status", "Response"]
}
```

### Email Delivery Node

**Purpose**: Send emails with extracted data via SMTP.

**Credit Cost**: 3 credits

**Features**:
- SMTP server integration
- HTML and plain text emails
- Attachment support
- CC/BCC recipients
- TLS/SSL encryption

**Configuration**:
```json
{
  "type": "email_delivery",
  "inputs": {
    "SMTP Server": "smtp.gmail.com",
    "SMTP Port": 587,
    "Username": "sender@example.com",
    "Password": "credential-id-uuid",
    "From Email": "sender@example.com",
    "To Email": "recipient@example.com",
    "Subject": "Workflow Results",
    "Body": "{{Extracted Data}}",
    "Use TLS": true
  },
  "outputs": ["Delivery Status", "Message ID"]
}
```

### SMS Delivery Node

**Purpose**: Send SMS notifications via Twilio integration.

**Credit Cost**: 2 credits

**Twilio Integration**:
- **Service**: Twilio Messaging API
- **Authentication**: Account SID and Auth Token
- **Features**: International SMS, delivery status, error handling

**Configuration**:
```json
{
  "type": "send_sms",
  "inputs": {
    "Account SID": "credential-id-uuid",
    "Auth Token": "credential-id-uuid", 
    "From Phone": "+1234567890",
    "To Phone": "+0987654321",
    "Message": "Workflow completed: {{Extracted Data}}"
  },
  "outputs": ["Delivery Status", "Message SID"]
}
```

## Flow Control Nodes

### Branch Node

**Purpose**: Conditional workflow execution based on data comparison.

**Credit Cost**: 1 credit

**Comparison Operations**:
- Equals, Not Equals
- Greater Than, Less Than
- Contains, Not Contains
- Is Empty, Is Not Empty

**Configuration**:
```json
{
  "type": "branch",
  "inputs": {
    "Left Value": "{{Product Stock}}",
    "Comparison": "equals",
    "Right Value": "In Stock"
  },
  "outputs": ["True Path", "False Path", "Left Value"]
}
```

### Delay Node

**Purpose**: Add time delays between workflow steps.

**Credit Cost**: 1 credit

**Features**:
- Fixed delays in seconds
- Random delays within ranges
- Human-like timing simulation

**Configuration**:
```json
{
  "type": "delay",
  "inputs": {
    "Delay (seconds)": 5
  },
  "outputs": ["Completed"]
}
```

## External Integrations

### Clerk Authentication

**Purpose**: User authentication and management.

**Features**:
- JWT token validation
- Social login support (Google, GitHub, etc.)
- User profile management
- Session handling

**Integration Points**:
- API authentication middleware
- Frontend authentication hooks
- User session management

### AWS Services

#### Secrets Manager
- **Purpose**: Secure credential storage
- **Features**: Automatic rotation, encryption at rest
- **Usage**: API keys, passwords, tokens

#### SQS (Simple Queue Service)
- **Purpose**: Message queuing for workflow execution
- **Features**: Dead letter queues, message persistence
- **Usage**: Decouple scheduling from execution

#### EventBridge
- **Purpose**: Event-driven architecture
- **Features**: Scheduled triggers, event routing
- **Usage**: Workflow scheduling, system events

#### ECS Fargate
- **Purpose**: Containerized workflow execution
- **Features**: Auto-scaling, spot instances
- **Usage**: Worker task execution

### Database Integration

**PostgreSQL Features**:
- **ACID Compliance**: Reliable data consistency
- **Encryption**: Data encryption at rest and in transit
- **Backup**: Automated backups and point-in-time recovery
- **Scaling**: Read replicas and connection pooling

**Data Models**:
- Users and authentication
- Workflows and versions
- Executions and phases
- Credentials and secrets
- Logs and monitoring

## Credit System

The credit system provides usage tracking and cost control:

**Credit Costs by Node Type**:
- Browser Launch: 5-7 credits (varies by type)
- Data Extraction: 2-4 credits (AI extraction costs more)
- Data Processing: 1-2 credits
- Communication: 2-3 credits
- Flow Control: 1 credit

**Credit Management**:
- **Guest Users**: 50 credits (200 max after signup)
- **Authenticated Users**: Custom credit packages
- **Usage Tracking**: Real-time credit consumption
- **Billing Integration**: Automatic credit deduction

This comprehensive node library provides the building blocks for creating sophisticated workflow automation solutions, from simple web scraping to complex multi-step business processes.
