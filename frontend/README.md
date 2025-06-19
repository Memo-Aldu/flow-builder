# Flow Builder Frontend

Modern React/Next.js frontend for the Flow Builder workflow automation platform.

## Architecture

```mermaid
graph TB
    subgraph "UI Layer"
        Pages[Next.js Pages]
        Components[React Components]
        Layout[Layout Components]
    end

    subgraph "State Management"
        Zustand[Zustand Stores]
        Context[React Context]
        LocalStorage[Local Storage]
    end

    subgraph "Data Layer"
        API[API Client]
        Auth[Clerk Auth]
        Cache[React Query Cache]
    end

    subgraph "Workflow Editor"
        ReactFlow[React Flow]
        Nodes[Custom Nodes]
        Edges[Custom Edges]
        Toolbar[Node Toolbar]
    end

    subgraph "UI Framework"
        Tailwind[Tailwind CSS]
        Shadcn[shadcn/ui]
        Icons[Lucide Icons]
    end

    Pages --> Components
    Components --> Zustand
    Components --> API
    API --> Auth
    Components --> ReactFlow
    ReactFlow --> Nodes
    Components --> Shadcn
    Shadcn --> Tailwind

    classDef ui fill:#e1f5fe
    classDef state fill:#f3e5f5
    classDef data fill:#e8f5e8
    classDef editor fill:#fff3e0
    classDef framework fill:#f1f8e9

    class Pages,Components,Layout ui
    class Zustand,Context,LocalStorage state
    class API,Auth,Cache data
    class ReactFlow,Nodes,Edges,Toolbar editor
    class Tailwind,Shadcn,Icons framework
```

## Features

### Core Features
- **Visual Workflow Editor**: Drag-and-drop workflow creation with React Flow
- **Real-time Updates**: Live execution monitoring and status updates
- **Responsive Design**: Mobile-friendly interface with Tailwind CSS
- **Dark/Light Mode**: Theme switching with system preference detection
- **Type Safety**: Full TypeScript support throughout the application

### Authentication & User Management
- **Clerk Integration**: Secure authentication with social logins
- **Guest Access**: Trial mode with no signup required
- **User Dashboard**: Personalized dashboard with usage statistics
- **Session Management**: Automatic session handling and renewal

### Workflow Management
- **Visual Editor**: Intuitive drag-and-drop workflow builder
- **Node Library**: Extensive collection of pre-built workflow nodes
- **Real-time Validation**: Instant feedback on workflow configuration
- **Version Control**: Workflow versioning with visual diff
- **Execution Monitoring**: Live execution tracking with detailed logs

### UI/UX Features
- **Modern Design**: Clean, professional interface
- **Accessibility**: WCAG compliant components
- **Performance**: Optimized for fast loading and smooth interactions
- **Internationalization**: Ready for multi-language support