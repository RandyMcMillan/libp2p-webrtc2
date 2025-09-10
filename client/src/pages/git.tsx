import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GitBranch, GitCommit, FileText, Folder, Clock, User } from "lucide-react";

interface GitStatus {
  branch: string;
  ahead: number;
  behind: number;
  modified: string[];
  created: string[];
  deleted: string[];
  staged: string[];
  lastCommit: {
    hash: string;
    date: string;
    message: string;
    author_name: string;
  };
}

interface Commit {
  hash: string;
  date: string;
  message: string;
  author_name: string;
  author_email: string;
}

export default function Git() {
  const [selectedCommit, setSelectedCommit] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);

  const { data: gitStatus } = useQuery<GitStatus>({
    queryKey: ['/api/git/status'],
  });

  const { data: commits } = useQuery<Commit[]>({
    queryKey: ['/api/git/commits'],
  });

  const { data: branches } = useQuery<{ current: string; all: string[]; local: string[] }>({
    queryKey: ['/api/git/branches'],
  });

  const { data: fileTree } = useQuery<{ name: string; type: string }[]>({
    queryKey: ['/api/git/tree'],
  });

  const { data: fileContent } = useQuery<{ content: string; path: string }>({
    queryKey: ['/api/git/file', selectedFile],
    enabled: !!selectedFile,
  });

  const { data: commitDiff } = useQuery<{ diff: string }>({
    queryKey: ['/api/git/diff', selectedCommit],
    enabled: !!selectedCommit,
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getFileIcon = (item: { name: string; type: string }) => {
    if (item.type === 'directory') {
      return <Folder className="h-4 w-4" />;
    }
    return <FileText className="h-4 w-4" />;
  };

  return (
    <div className="px-4 py-6 space-y-6">
      {/* Repository Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GitBranch className="h-5 w-5" />
            Repository Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          {gitStatus && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Current branch:</span>
                <Badge variant="secondary">{gitStatus.branch}</Badge>
              </div>
              
              {gitStatus.lastCommit && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <GitCommit className="h-4 w-4" />
                    <span className="font-mono text-xs">{gitStatus.lastCommit.hash.substring(0, 8)}</span>
                    <span className="text-muted-foreground">{gitStatus.lastCommit.message}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <User className="h-3 w-3" />
                    <span>{gitStatus.lastCommit.author_name}</span>
                    <Clock className="h-3 w-3" />
                    <span>{formatDate(gitStatus.lastCommit.date)}</span>
                  </div>
                </div>
              )}

              {(gitStatus.modified.length > 0 || gitStatus.created.length > 0 || gitStatus.deleted.length > 0) && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Working directory changes:</h4>
                  <div className="space-y-1">
                    {gitStatus.modified.map((file) => (
                      <div key={file} className="flex items-center gap-2 text-sm">
                        <Badge variant="outline" className="text-orange-600">M</Badge>
                        <span>{file}</span>
                      </div>
                    ))}
                    {gitStatus.created.map((file) => (
                      <div key={file} className="flex items-center gap-2 text-sm">
                        <Badge variant="outline" className="text-green-600">A</Badge>
                        <span>{file}</span>
                      </div>
                    ))}
                    {gitStatus.deleted.map((file) => (
                      <div key={file} className="flex items-center gap-2 text-sm">
                        <Badge variant="outline" className="text-red-600">D</Badge>
                        <span>{file}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Main Interface Tabs */}
      <Tabs defaultValue="files" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="files">Files</TabsTrigger>
          <TabsTrigger value="commits">Commits</TabsTrigger>
          <TabsTrigger value="branches">Branches</TabsTrigger>
        </TabsList>

        {/* File Browser */}
        <TabsContent value="files" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Folder className="h-5 w-5" />
                Repository Files
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-64">
                <div className="space-y-2">
                  {fileTree?.map((item) => (
                    <Button
                      key={item.name}
                      variant="ghost"
                      className="w-full justify-start"
                      onClick={() => item.type === 'file' ? setSelectedFile(item.name) : null}
                      disabled={item.type === 'directory'}
                      data-testid={`file-${item.name}`}
                    >
                      {getFileIcon(item)}
                      <span className="ml-2">{item.name}</span>
                      {item.type === 'directory' && <span className="ml-auto text-xs text-muted-foreground">dir</span>}
                    </Button>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* File Content Viewer */}
          {selectedFile && fileContent && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  {selectedFile}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-64">
                  <pre className="text-xs whitespace-pre-wrap">{fileContent.content}</pre>
                </ScrollArea>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Commit History */}
        <TabsContent value="commits" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GitCommit className="h-5 w-5" />
                Commit History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-64">
                <div className="space-y-4">
                  {commits?.map((commit) => (
                    <div key={commit.hash} className="border-l-2 border-muted pl-4 pb-4">
                      <Button
                        variant="ghost"
                        className="h-auto p-0 justify-start"
                        onClick={() => setSelectedCommit(commit.hash)}
                        data-testid={`commit-${commit.hash.substring(0, 8)}`}
                      >
                        <div className="text-left">
                          <div className="font-medium">{commit.message}</div>
                          <div className="text-xs text-muted-foreground flex items-center gap-2 mt-1">
                            <span className="font-mono">{commit.hash.substring(0, 8)}</span>
                            <User className="h-3 w-3" />
                            <span>{commit.author_name}</span>
                            <Clock className="h-3 w-3" />
                            <span>{formatDate(commit.date)}</span>
                          </div>
                        </div>
                      </Button>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Commit Diff */}
          {selectedCommit && commitDiff && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GitCommit className="h-5 w-5" />
                  Commit Diff: {selectedCommit.substring(0, 8)}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-64">
                  <pre className="text-xs whitespace-pre-wrap">{commitDiff.diff}</pre>
                </ScrollArea>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Branches */}
        <TabsContent value="branches" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GitBranch className="h-5 w-5" />
                Branches
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-64">
                <div className="space-y-2">
                  {branches?.local?.map((branch: string) => (
                    <div key={branch} className="flex items-center justify-between p-2 rounded border">
                      <span className="font-medium">{branch}</span>
                      {branch === branches.current && (
                        <Badge variant="default">Current</Badge>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}