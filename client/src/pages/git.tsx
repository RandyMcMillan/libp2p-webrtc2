import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { GitBranch, GitCommit, FileText, Folder, Clock, User, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

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
  const [patchDialog, setPatchDialog] = useState<{ open: boolean; commitHash: string; commitMessage: string }>({
    open: false,
    commitHash: '',
    commitMessage: ''
  });
  const [selectedPeer, setSelectedPeer] = useState<string>('');
  const [patchMessage, setPatchMessage] = useState<string>('');

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: gitStatus } = useQuery<GitStatus>({
    queryKey: ['/api/git/status'],
  });

  const { data: peers } = useQuery<Array<{ id: string; status: string; protocol: string }>>({
    queryKey: ['/api/peers'],
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

  const sendPatchMutation = useMutation({
    mutationFn: async (data: { commitHash: string; targetPeerId: string; message: string; fromPeerId: string }) => {
      const response = await fetch('/api/git/send-patch', {
        method: 'POST',
        body: JSON.stringify(data),
        headers: { 'Content-Type': 'application/json' }
      });
      if (!response.ok) throw new Error('Failed to send patch');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Patch sent successfully",
        description: "The git patch has been sent to the selected peer."
      });
      setPatchDialog({ open: false, commitHash: '', commitMessage: '' });
      setSelectedPeer('');
      setPatchMessage('');
      queryClient.invalidateQueries({ queryKey: ['/api/messages'] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to send patch",
        description: error.message || "An error occurred while sending the patch.",
        variant: "destructive"
      });
    }
  });

  const handleSendPatch = () => {
    if (!selectedPeer || !patchDialog.commitHash) {
      toast({
        title: "Missing information",
        description: "Please select a peer and commit.",
        variant: "destructive"
      });
      return;
    }

    sendPatchMutation.mutate({
      commitHash: patchDialog.commitHash,
      targetPeerId: selectedPeer,
      message: patchMessage || `Sharing commit: ${patchDialog.commitMessage}`,
      fromPeerId: 'current-peer' // This should be the current peer's ID
    });
  };

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
                      <div className="flex items-start justify-between">
                        <Button
                          variant="ghost"
                          className="h-auto p-0 justify-start flex-1"
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
                        
                        <Dialog 
                          open={patchDialog.open && patchDialog.commitHash === commit.hash}
                          onOpenChange={(open) => 
                            setPatchDialog({ 
                              open, 
                              commitHash: open ? commit.hash : '', 
                              commitMessage: open ? commit.message : '' 
                            })
                          }
                        >
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="ml-2"
                              data-testid={`send-patch-${commit.hash.substring(0, 8)}`}
                            >
                              <Send className="h-3 w-3" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Send Patch to Peer</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <label className="text-sm font-medium">Commit:</label>
                                <p className="text-sm text-muted-foreground">{commit.message}</p>
                                <p className="text-xs text-muted-foreground">{commit.hash.substring(0, 8)}</p>
                              </div>
                              
                              <div>
                                <label className="text-sm font-medium">Select Peer:</label>
                                <Select value={selectedPeer} onValueChange={setSelectedPeer}>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Choose a connected peer" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {peers?.filter((peer: any) => peer.status === 'connected')?.map((peer: any) => (
                                      <SelectItem key={peer.id} value={peer.id}>
                                        {peer.id} ({peer.protocol})
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              
                              <div>
                                <label className="text-sm font-medium">Message (optional):</label>
                                <Textarea
                                  value={patchMessage}
                                  onChange={(e) => setPatchMessage(e.target.value)}
                                  placeholder="Add a message to accompany the patch..."
                                  className="mt-1"
                                />
                              </div>
                              
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="outline"
                                  onClick={() => setPatchDialog({ open: false, commitHash: '', commitMessage: '' })}
                                >
                                  Cancel
                                </Button>
                                <Button
                                  onClick={handleSendPatch}
                                  disabled={sendPatchMutation.isPending || !selectedPeer}
                                  data-testid="confirm-send-patch"
                                >
                                  {sendPatchMutation.isPending ? 'Sending...' : 'Send Patch'}
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
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