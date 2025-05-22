"use client";

import { 
    Accordion, 
    AccordionContent, 
    AccordionItem,
    AccordionTrigger} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { TaskRegistry } from '@/lib/workflow/task/registry';
import { TaskType } from '@/types/task';
import { BetweenHorizonalStartIcon } from 'lucide-react';
import React from 'react'

const TaskMenu = () => {
  return (
    <aside className='w-[340px] min-w-[340px] max-w-[340px] border-r-2
    border-separate h-full p-2 px-4 overflow-auto'>
        <Accordion 
            type='multiple' 
            className='w-full' 
            defaultValue={['Extraction', 'Entrypoint', 'Timing', 'Storage', 'Deliver Results']}>
            <AccordionItem value='Entrypoint'>
                <AccordionTrigger className='font-bold'>
                    Browser Automation
                </AccordionTrigger>
                <AccordionContent className='flex flex-col gap-1'>
                    <TaskMenuBtn taskType={TaskType.LAUNCH_BROWSER} />
                    <TaskMenuBtn taskType={TaskType.CLICK_ELEMENT} />
                    <TaskMenuBtn taskType={TaskType.FILL_INPUT} />
                </AccordionContent>
            </AccordionItem>
            <AccordionItem value='Extraction'>
                <AccordionTrigger className='font-bold'>
                    Data Extraction
                </AccordionTrigger>
                <AccordionContent className='flex flex-col gap-1'>
                    <TaskMenuBtn taskType={TaskType.GET_HTML} />
                    <TaskMenuBtn taskType={TaskType.GET_TEXT_FROM_HTML} />
                    <TaskMenuBtn taskType={TaskType.CONDENSE_HTML} />
                    <TaskMenuBtn taskType={TaskType.EXTRACT_DATA_OPENAI} />
                </AccordionContent>
            </AccordionItem>
            <AccordionItem value='Timing'>
                <AccordionTrigger className='font-bold'>
                    Timing Controls
                </AccordionTrigger>
                <AccordionContent className='flex flex-col gap-1'>
                    <TaskMenuBtn taskType={TaskType.DELAY} />
                    <TaskMenuBtn taskType={TaskType.WAIT_FOR_ELEMENT} />
                </AccordionContent>
            </AccordionItem>
            <AccordionItem value='Storage'>
                <AccordionTrigger className='font-bold'>
                    Data Storage
                </AccordionTrigger>
                <AccordionContent className='flex flex-col gap-1'>
                    <TaskMenuBtn taskType={TaskType.READ_PROPERTY_FROM_JSON} />
                </AccordionContent>
            </AccordionItem>
            <AccordionItem value='Deliver Results'>
                <AccordionTrigger className='font-bold'>
                    Deliver Results
                </AccordionTrigger>
                <AccordionContent className='flex flex-col gap-1'>
                    <TaskMenuBtn taskType={TaskType.DELIVER_TO_WEBHOOK} />
                    <TaskMenuBtn taskType={TaskType.SEND_SMS} />
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
        className='flex justify-between items-center gap-2 border w-full'
        onDragStart={(e) => ondragstart(e, taskType)}>
            <div className="flex gap-2 items-center">
                <task.icon size={20} />
                {task.label}
            </div>
            {task.isEntryPoint && (
            <div className="flex items-end">
                    <BetweenHorizonalStartIcon size={20} className='stroke-green-400'/>
            </div>
            )}
        </Button>
    )

}

export default TaskMenu