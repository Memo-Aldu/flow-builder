"use client";

import { 
    Accordion, 
    AccordionContent, 
    AccordionItem,
    AccordionTrigger} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { TaskRegistry } from '@/lib/workflow/task/registry';
import { TaskType } from '@/types/task';
import React from 'react'

const TaskMenu = () => {
  return (
    <aside className='w-[340px] min-w-[340px] max-w-[340px] border-r-2
    border-separate h-full p-2 px-4 overflow-auto'>
        <Accordion type='multiple' className='w-full' defaultValue={['Extraction', 'Entrypoint']}>
            <AccordionItem value='Entrypoint'>
                <AccordionTrigger className='font-bold'>
                    Entrypoint
                </AccordionTrigger>
                <AccordionContent className='flex flex-col gap-1'>
                    <TaskMenuBtn taskType={TaskType.LAUNCH_BROWSER} />
                </AccordionContent>
            </AccordionItem>
            <AccordionItem value='Extraction'>
                <AccordionTrigger className='font-bold'>
                    Data Extraction
                </AccordionTrigger>
                <AccordionContent className='flex flex-col gap-1'>
                    <TaskMenuBtn taskType={TaskType.GET_HTML} />
                    <TaskMenuBtn taskType={TaskType.GET_TEXT_FROM_HTML} />
                </AccordionContent>
            </AccordionItem>
        </Accordion>
    </aside>
  )
}


export const TaskMenuBtn = ({ taskType }: { taskType: TaskType }) => {
    const task = TaskRegistry[taskType]

    const ondragstart = (e: React.DragEvent<HTMLButtonElement>, taskType: TaskType) => {
        e.dataTransfer.setData('application/reactflow', taskType)
        e.dataTransfer.effectAllowed = 'move'
    }

    return (
        <Button 
        variant={'secondary'} 
        draggable
        className='flex justify-between items-center gap-2border w-full'
        onDragStart={(e) => ondragstart(e, taskType)}>
            <div className="flex gap-2">
                <task.icon size={20} />
                {task.label}
            </div>
        </Button>
    )

}

export default TaskMenu