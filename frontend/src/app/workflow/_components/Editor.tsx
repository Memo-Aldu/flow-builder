"use client";

import { Workflow } from '@/types/workflows';
import React from 'react'
import { ReactFlowProvider } from '@xyflow/react';
import FlowEditor from '@/app/workflow/_components/FlowEditor';
import TopBar from '@/app/workflow/_components/topbar/TopBar';
import TaskMenu from '@/app/workflow/_components/TaskMenu';

const Editor = ({ workflow }: { workflow: Workflow }) => {
  return (
    <ReactFlowProvider>
        <div className="flex flex-col w-full h-full overflow-hidden">
            <TopBar 
            title="Workflow Editor" 
            subtitle={workflow.name}
            workflowId={workflow.id}/>
            <section className='flex h-full overflow-auto'>
                <TaskMenu />
                <FlowEditor workflow={workflow} />
            </section>
        </div>
    </ReactFlowProvider>
  )
}


export default Editor
