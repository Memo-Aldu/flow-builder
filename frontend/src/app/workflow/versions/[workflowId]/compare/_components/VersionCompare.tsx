import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { WorkflowVersion } from '@/types/versions'
import { format } from 'date-fns/format';
import React from 'react'


type CompareProps = {
    versionA: WorkflowVersion;
    versionB: WorkflowVersion;
}

const VersionCompare = ({ versionA, versionB } : CompareProps) => {
  return (
    <div className="w-full h-full flex">
      {/* Left version */}
      <Card className="flex-1 h-full rounded-none border-r">
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            Version {versionA.version_number}
            <Badge variant="outline">
              {format(new Date(versionA.created_at), "yyyy-MM-dd HH:mm")}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="h-[calc(100%-60px)] p-0">
          <div className="">
            TODO - Display version A
          </div>
        </CardContent>
      </Card>

      {/* Right version */}
      <Card className="flex-1 h-full rounded-none border-l">
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            Version {versionB.version_number}
            <Badge variant="outline">
              {format(new Date(versionB.created_at), "yyyy-MM-dd HH:mm")}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="h-[calc(100%-60px)] p-0">
          <div className="">
            TODO - Display version B
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default VersionCompare