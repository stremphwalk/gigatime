import { useEffect, useState } from "react";
import { 
  useTeams, useCreateTeam, useJoinTeam, useLeaveTeam,
  useProlongTeam,
  useTeamMembers,
  useTeamTodos, useCreateTodo, useUpdateTodo, useDeleteTodo,
  useTeamCalendar, useCreateEvent, useUpdateEvent, useDeleteEvent,
  useTeamBulletin, useCreateBulletinPost, useUpdateBulletinPost, useDeleteBulletinPost,
  useRenameTeam, useDisbandTeam, useRemoveMember, useTransferAdmin,
} from "@/hooks/use-teams";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { getSupabaseClient } from "@/lib/supabase";
import { Users, Plus, LogIn, Copy, Calendar, Clock, Shield, User, ArrowLeft, CheckSquare, CalendarDays, Pin, PinOff, Trash2, Edit2, Save } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export function TeamManagement() {
  const { data: userTeams = [], isLoading } = useTeams();
  const { toast } = useToast();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showJoinDialog, setShowJoinDialog] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const createTeamMutation = useCreateTeam();
  const joinTeamMutation = useJoinTeam();
  const leaveTeamMutation = useLeaveTeam();
  const prolongMutation = useProlongTeam();

  const [createForm, setCreateForm] = useState({
    name: "",
    description: "",
  });

  const [joinForm, setJoinForm] = useState({
    groupCode: "",
  });

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const newTeam = await createTeamMutation.mutateAsync(createForm);
      
      toast({
        title: "Team Created Successfully!",
        description: `Team "${(newTeam as any).name}" created with group code: ${(newTeam as any).groupCode}`,
      });
      
      setCreateForm({ name: "", description: "" });
      setShowCreateDialog(false);
      
    } catch (error: any) {
      toast({
        title: "Failed to Create Team",
        description: error.message || "An error occurred while creating the team",
        variant: "destructive",
      });
    }
  };

  const handleJoinTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const result = await joinTeamMutation.mutateAsync(joinForm);
      
      toast({
        title: "Successfully Joined Team!",
        description: `Welcome to "${(result as any).team?.name}"`,
      });
      
      setJoinForm({ groupCode: "" });
      setShowJoinDialog(false);
      
    } catch (error: any) {
      toast({
        title: "Failed to Join Team",
        description: error.message || "Invalid group code or team is full",
        variant: "destructive",
      });
    }
  };

  const copyGroupCode = (groupCode: string) => {
    navigator.clipboard.writeText(groupCode);
    toast({
      title: "Group Code Copied!",
      description: `Group code "${groupCode}" copied to clipboard`,
    });
  };

  const handleLeaveTeam = async (teamId: string, teamName: string) => {
    if (!confirm(`Are you sure you want to leave "${teamName}"? This cannot be undone.`)) {
      return;
    }

    try {
      const result = await leaveTeamMutation.mutateAsync(teamId);
      
      toast({
        title: "Left Team Successfully",
        description: (result as any).message || `You have left "${teamName}"`,
      });
      
    } catch (error: any) {
      console.error("Error leaving team:", error);
      toast({
        title: "Error Leaving Team",
        description: error?.message || "Failed to leave team. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleTeamClick = (teamId: string) => {
    setSelectedTeam(teamId);
  };

  const handleBackToTeams = () => {
    setSelectedTeam(null);
  };

  // Collaboration hooks (enabled when a team is selected)
  const teamId = selectedTeam || "";
  const { data: members = [] } = useTeamMembers(teamId);
  const { data: todos = [] } = useTeamTodos(teamId);
  const { data: events = [] } = useTeamCalendar(teamId);
  const { data: posts = [] } = useTeamBulletin(teamId);

  const createTodo = useCreateTodo(teamId);
  const updateTodo = useUpdateTodo(teamId);
  const deleteTodo = useDeleteTodo(teamId);
  const createEvent = useCreateEvent(teamId);
  const updateEvent = useUpdateEvent(teamId);
  const deleteEvent = useDeleteEvent(teamId);
  const createPost = useCreateBulletinPost(teamId);
  const updatePost = useUpdateBulletinPost(teamId);
  const deletePost = useDeleteBulletinPost(teamId);

  const [newTask, setNewTask] = useState({ title: "", priority: "medium", dueDate: "", assignees: [] as string[], status: "backlog" });
  const [newEvent, setNewEvent] = useState({ title: "", startDate: "", endDate: "", allDay: false, type: "other" });
  const [newPost, setNewPost] = useState({ title: "", content: "" });

  // Supabase Realtime subscriptions for selected team
  useEffect(() => {
    const client = getSupabaseClient();
    if (!client || !teamId) return;
    const channels = [] as any[];
    const tables = [
      { name: 'team_todos', key: ["/api/teams", teamId, "todos"] as const },
      { name: 'team_calendar_events', key: ["/api/teams", teamId, "calendar"] as const },
      { name: 'team_bulletin_posts', key: ["/api/teams", teamId, "bulletin"] as const },
      { name: 'team_members', key: ["/api/teams", teamId, "members"] as const },
    ];
    for (const t of tables) {
      const chan = client
        .channel(`realtime:${t.name}:${teamId}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: t.name, filter: `team_id=eq.${teamId}` }, () => {
          queryClient.invalidateQueries({ queryKey: t.key as any });
        })
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            // Optionally log
          }
        });
      channels.push(chan);
    }
    // Also listen for the team row itself (rename/disband)
    const teamChan = client
      .channel(`realtime:teams:${teamId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'teams', filter: `id=eq.${teamId}` }, () => {
        queryClient.invalidateQueries({ queryKey: ["/api/teams"] });
      })
      .subscribe();
    channels.push(teamChan);
    return () => {
      channels.forEach(c => client.removeChannel(c));
    };
  }, [teamId, queryClient]);

  // If a team is selected, show the team collaboration view
  if (selectedTeam) {
    const team = userTeams.find(ut => ut.team.id === selectedTeam)?.team;
    if (!team) return null;

    // hooks and state defined above, keyed by selected teamId

    return (
      <div className="max-w-4xl mx-auto p-6">
        {/* Header with back button */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            onClick={handleBackToTeams}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
          >
            <ArrowLeft size={16} />
            Back to Teams
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{team.name}</h1>
            <p className="text-sm text-gray-600">Group Code: {team.groupCode}</p>
          </div>
        </div>

        {/* Team collaboration features */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Calendar Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarDays className="text-blue-500" size={20} />
                Team Calendar (This Week)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {(() => {
                const end = new Date(team.expiresAt);
                const start = new Date(end);
                start.setDate(end.getDate() - 6);
                const days = Array.from({ length: 7 }, (_, i) => {
                  const d = new Date(start);
                  d.setDate(start.getDate() + i);
                  d.setHours(0,0,0,0);
                  return d;
                });
                const eventsByDay = days.map((d) => {
                  return events.filter(ev => {
                    const sd = new Date(ev.startDate);
                    return sd.getFullYear() === d.getFullYear() && sd.getMonth() === d.getMonth() && sd.getDate() === d.getDate();
                  });
                });
                const weekday = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
                return (
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {days.map((d, idx) => (
                        <div key={d.toISOString()} className="border rounded p-2">
                          <div className="text-sm font-medium mb-2">{weekday[d.getDay()]} {d.toLocaleDateString()}</div>
                          <div className="space-y-2">
                            {eventsByDay[idx].length === 0 && <div className="text-xs text-gray-500">No events</div>}
                            {eventsByDay[idx].map(ev => (
                              <div key={ev.id} className="text-xs flex items-center justify-between">
                                <div>
                                  <div className="font-medium">{ev.title}</div>
                                  {!ev.allDay && <div className="text-gray-600">{new Date(ev.startDate).toLocaleTimeString()} – {new Date(ev.endDate).toLocaleTimeString()}</div>}
                                  {ev.allDay && <div className="text-gray-600">All day</div>}
                                </div>
                                <Button size="sm" variant="outline" onClick={() => deleteEvent.mutate(ev.id)}>
                                  <Trash2 size={12} />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="border rounded p-3 space-y-2">
                      <div className="font-medium text-sm">Add Event</div>
                      <Input placeholder="Title" value={newEvent.title} onChange={(e) => setNewEvent(prev => ({ ...prev, title: e.target.value }))} />
                      <div className="grid grid-cols-2 gap-2">
                        <Input type="datetime-local" value={newEvent.startDate} onChange={(e) => setNewEvent(prev => ({ ...prev, startDate: e.target.value }))} />
                        <Input type="datetime-local" value={newEvent.endDate} onChange={(e) => setNewEvent(prev => ({ ...prev, endDate: e.target.value }))} />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <Input placeholder="Type (rounds/presentation/absence/other)" value={newEvent.type} onChange={(e) => setNewEvent(prev => ({ ...prev, type: e.target.value }))} />
                        <div className="flex items-center gap-2 text-sm">
                          <label className="flex items-center gap-2"><input type="checkbox" checked={newEvent.allDay} onChange={(e) => setNewEvent(prev => ({ ...prev, allDay: e.target.checked }))} /> All day</label>
                        </div>
                      </div>
                      <Button size="sm" onClick={() => {
                        if (!newEvent.title || !newEvent.startDate || !newEvent.endDate) return;
                        createEvent.mutate(newEvent as any, { onSuccess: () => setNewEvent({ title: "", startDate: "", endDate: "", allDay: false, type: "other" }) });
                      }}>Add</Button>
                    </div>
                  </div>
                );
              })()}
            </CardContent>
          </Card>

          {/* Todo Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckSquare className="text-green-500" size={20} />
                Team Tasks
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {(() => {
                  const prioRank: Record<string, number> = { urgent: 0, high: 1, medium: 2, low: 3 } as any;
                  const end = new Date(team.expiresAt);
                  const start = new Date(end); start.setDate(end.getDate() - 6);
                  const inWeek = (d?: any) => d ? (new Date(d) >= start && new Date(d) <= end) : false;
                  const pending = todos.filter(t => (t as any).status !== 'completed')
                    .sort((a,b) => (prioRank[(a.priority||'medium') as string] - prioRank[(b.priority||'medium') as string]));
                  const completedThisWeek = todos.filter(t => (t as any).status === 'completed' && inWeek((t as any).completedAt));
                  return (
                    <>
                      {pending.length === 0 && <div className="text-sm text-gray-500">No active tasks</div>}
                      {pending.map(td => (
                        <div key={td.id} className="border rounded p-2 text-sm">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className={`font-medium ${td.completed ? 'line-through text-gray-500' : ''}`}>{td.title}</div>
                              <div className="text-gray-600">
                                Priority: {td.priority} • Status: {(td as any).status || 'backlog'}
                              </div>
                              {td.dueDate && <div className="text-gray-600">Due: {new Date(td.dueDate).toLocaleDateString()}</div>}
                              {(td.assignees && td.assignees.length > 0) && (
                                <div className="text-gray-600">Assignees: {td.assignees.map(a => `${a.firstName || ''} ${a.lastName || ''}`.trim() || a.email).join(', ')}</div>
                              )}
                            </div>
                            <div className="flex gap-2">
                              <Button size="sm" variant="outline" onClick={() => updateTodo.mutate({ id: td.id, data: { completed: !td.completed, status: !td.completed ? 'completed' : 'backlog', completedAt: !td.completed ? new Date() as any : null } })}>
                                {td.completed ? 'Uncomplete' : 'Complete'}
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => deleteTodo.mutate(td.id)}>
                                <Trash2 size={14} />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                      <div className="mt-3">
                        <div className="text-sm font-medium">Completed (This Week)</div>
                        <div className="space-y-2 mt-2">
                          {completedThisWeek.length === 0 && <div className="text-xs text-gray-500">None</div>}
                          {completedThisWeek.map(td => (
                            <div key={td.id} className="border rounded p-2 text-xs bg-gray-50">
                              <div className="flex items-center justify-between">
                                <div className="line-through">{td.title}</div>
                                <div className="text-gray-500">{(td as any).completedAt && new Date((td as any).completedAt).toLocaleDateString()}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  );
                })()}
                <div className="border rounded p-3 space-y-2">
                  <div className="font-medium text-sm">Add Task</div>
                  <Input placeholder="Title" value={newTask.title} onChange={(e) => setNewTask(prev => ({ ...prev, title: e.target.value }))} />
                  <div className="grid grid-cols-2 gap-2">
                    <Input placeholder="Priority (low/medium/high/urgent)" value={newTask.priority} onChange={(e) => setNewTask(prev => ({ ...prev, priority: e.target.value }))} />
                    <Input type="date" value={newTask.dueDate} onChange={(e) => setNewTask(prev => ({ ...prev, dueDate: e.target.value }))} />
                  </div>
                  <div>
                    <div className="text-xs text-gray-600 mb-1">Assign to</div>
                    <div className="flex flex-wrap gap-3">
                      {members.map(m => (
                        <label key={m.user.id} className="text-xs flex items-center gap-1 border rounded px-2 py-1">
                          <input type="checkbox" checked={newTask.assignees.includes(m.user.id)} onChange={(e) => {
                            setNewTask(prev => ({ ...prev, assignees: e.target.checked ? [...prev.assignees, m.user.id] : prev.assignees.filter(id => id !== m.user.id) }));
                          }} />
                          {(m.user.firstName || m.user.lastName) ? `${m.user.firstName || ''} ${m.user.lastName || ''}`.trim() : (m.user.email || 'Member')}
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Input placeholder="Status (backlog/in_progress/ready_to_review/completed)" value={newTask.status} onChange={(e) => setNewTask(prev => ({ ...prev, status: e.target.value }))} />
                  </div>
                  <Button size="sm" onClick={() => {
                    if (!newTask.title) return;
                    createTodo.mutate({ title: newTask.title, priority: newTask.priority as any, dueDate: newTask.dueDate ? new Date(newTask.dueDate) as any : undefined, status: newTask.status as any, assigneeIds: newTask.assignees }, {
                      onSuccess: () => setNewTask({ title: "", priority: "medium", dueDate: "", assignees: [], status: "backlog" })
                    });
                  }}>Add</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Bulletin */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Team Bulletin</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {posts.length === 0 && <div className="text-sm text-gray-500">No posts yet</div>}
              {posts.map(p => (
                <div key={p.id} className="border rounded p-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-medium">{p.title} {p.pinned && <span className="text-xs text-blue-600">(Pinned)</span>}</div>
                      <div className="text-sm whitespace-pre-wrap text-gray-700 mt-1">{p.content}</div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => updatePost.mutate({ id: p.id, data: { pinned: !p.pinned } })}>
                        {p.pinned ? <PinOff size={14} /> : <Pin size={14} />}
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => deletePost.mutate(p.id)}>
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
              <div className="border rounded p-3 space-y-2">
                <div className="font-medium text-sm">New Post</div>
                <Input placeholder="Title" value={newPost.title} onChange={(e) => setNewPost(prev => ({ ...prev, title: e.target.value }))} />
                <Textarea placeholder="Write something (markdown supported)" value={newPost.content} onChange={(e) => setNewPost(prev => ({ ...prev, content: e.target.value }))} />
                <Button size="sm" onClick={() => {
                  if (!newPost.title) return;
                  createPost.mutate(newPost as any, { onSuccess: () => setNewPost({ title: "", content: "" }) });
                }}>Post</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Admin: Team Settings */}
        {(() => {
          const myRole = userTeams.find(ut => ut.team.id === team.id)?.role;
          if (myRole !== 'admin') return null;
          return (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Team Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm font-medium mb-2">Rename Team</div>
                    <Input defaultValue={team.name} onBlur={(e) => renameTeam.mutate({ name: e.target.value, description: team.description || null })} />
                    <Input className="mt-2" placeholder="Description (optional)" defaultValue={team.description || ''} onBlur={(e) => renameTeam.mutate({ name: team.name, description: e.target.value || null })} />
                  </div>
                  <div>
                    <div className="text-sm font-medium mb-2">Disband Team</div>
                    <Button variant="destructive" onClick={() => {
                      if (confirm('Disband this team? This cannot be undone.')) disbandTeam.mutate(undefined, { onSuccess: () => handleBackToTeams() });
                    }}>Disband</Button>
                  </div>
                </div>
                <div className="mt-4">
                  <div className="text-sm font-medium mb-2">Members</div>
                  <div className="space-y-2">
                    {members.map(m => (
                      <div key={m.id} className="flex items-center justify-between border rounded p-2 text-sm">
                        <div>
                          {(m.user.firstName || m.user.lastName) ? `${m.user.firstName || ''} ${m.user.lastName || ''}`.trim() : (m.user.email || 'Member')}
                          {m.role === 'admin' && <span className="text-xs text-blue-600 ml-2">(Admin)</span>}
                        </div>
                        <div className="flex gap-2">
                          {m.role !== 'admin' && (
                            <Button size="sm" variant="outline" onClick={() => removeMember.mutate(m.user.id)}>
                              Remove
                            </Button>
                          )}
                          {m.role !== 'admin' && (
                            <Button size="sm" onClick={() => transferAdmin.mutate(m.user.id)}>
                              Make Admin
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })()}

        {/* Compact Team Info Bar */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg mb-6">
          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <Users className="text-purple-500" size={16} />
              <span className="text-gray-600">{members.length}/{team.maxMembers} members</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="text-orange-500" size={16} />
              <span className="text-gray-600">Expires {formatDistanceToNow(new Date(team.expiresAt))}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => copyGroupCode(team.groupCode)}
              className="flex items-center gap-2"
            >
              <span className="font-mono">{team.groupCode}</span>
              <Copy size={14} />
            </Button>
            {/* Prolong if within last 24h and user is admin */}
            {(() => {
              const myRole = userTeams.find(ut => ut.team.id === team.id)?.role;
              const hoursLeft = (new Date(team.expiresAt).getTime() - Date.now()) / (1000*60*60);
              if (myRole === 'admin' && hoursLeft <= 24) {
                return (
                  <Button size="sm" onClick={() => prolongMutation.mutate(team.id, { onSuccess: () => toast({ title: 'Team extended', description: 'Extended by 7 days' }) })}>
                    Prolong 7 days
                  </Button>
                );
              }
              return null;
            })()}
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <Users className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <p className="text-gray-600">Loading your teams...</p>
        </div>
      </div>
    );
  }

  if (userTeams.length === 0) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="text-center mb-8">
          <Users className="h-16 w-16 mx-auto mb-4 text-gray-400" />
          <h2 className="text-2xl font-bold mb-2">No Teams Yet</h2>
          <p className="text-gray-600 mb-6">
            Create a new team or join an existing one to start collaborating with your colleagues.
            <br />
            <span className="text-sm text-orange-600">Note: You can only be in one team at a time. Leave your current team to join or create a different one.</span>
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Card className="cursor-pointer hover:shadow-md transition-shadow border-dashed">
                <CardContent className="p-6 text-center">
                  <Plus className="h-12 w-12 mx-auto mb-3 text-blue-500" />
                  <CardTitle className="mb-2">Create Team</CardTitle>
                  <CardDescription>
                    Start a new team and invite colleagues with a unique group code
                  </CardDescription>
                </CardContent>
              </Card>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Team</DialogTitle>
                <DialogDescription>
                  Create a team to collaborate with up to 8 members. Teams automatically disband after 7 days.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateTeam} className="space-y-4">
                <div>
                  <Label htmlFor="team-name">Team Name *</Label>
                  <Input
                    id="team-name"
                    value={createForm.name}
                    onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                    placeholder="Emergency Department Team"
                    required
                    data-testid="input-team-name"
                  />
                </div>
                <div>
                  <Label htmlFor="team-description">Description (optional)</Label>
                  <Textarea
                    id="team-description"
                    value={createForm.description}
                    onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                    placeholder="Brief description of the team's purpose..."
                    data-testid="input-team-description"
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setShowCreateDialog(false)}
                    data-testid="button-cancel-create"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createTeamMutation.isPending || !createForm.name.trim()}
                    data-testid="button-create-team"
                  >
                    {createTeamMutation.isPending ? "Creating..." : "Create Team"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog open={showJoinDialog} onOpenChange={setShowJoinDialog}>
            <DialogTrigger asChild>
              <Card className="cursor-pointer hover:shadow-md transition-shadow border-dashed">
                <CardContent className="p-6 text-center">
                  <LogIn className="h-12 w-12 mx-auto mb-3 text-green-500" />
                  <CardTitle className="mb-2">Join Team</CardTitle>
                  <CardDescription>
                    Enter a 6-character group code to join an existing team
                  </CardDescription>
                </CardContent>
              </Card>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Join Existing Team</DialogTitle>
                <DialogDescription>
                  Enter the 6-character group code shared by a team member.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleJoinTeam} className="space-y-4">
                <div>
                  <Label htmlFor="group-code">Group Code *</Label>
                  <Input
                    id="group-code"
                    value={joinForm.groupCode}
                    onChange={(e) => setJoinForm({ ...joinForm, groupCode: e.target.value.toUpperCase() })}
                    placeholder="ABC123"
                    maxLength={6}
                    className="uppercase text-center text-lg tracking-widest font-mono"
                    required
                    data-testid="input-group-code"
                  />
                  <p className="text-sm text-gray-600 mt-1">
                    6 characters: letters and numbers
                  </p>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setShowJoinDialog(false)}
                    data-testid="button-cancel-join"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={joinTeamMutation.isPending || joinForm.groupCode.length !== 6}
                    data-testid="button-join-team"
                  >
                    {joinTeamMutation.isPending ? "Joining..." : "Join Team"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">My Teams</h2>
          <p className="text-gray-600">Collaborate with your medical teams</p>
        </div>
        <div className="flex space-x-2">
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button data-testid="button-create-new-team">
                <Plus className="h-4 w-4 mr-2" />
                Create Team
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Team</DialogTitle>
                <DialogDescription>
                  Create a team to collaborate with up to 8 members. Teams automatically disband after 7 days.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateTeam} className="space-y-4">
                <div>
                  <Label htmlFor="team-name">Team Name *</Label>
                  <Input
                    id="team-name"
                    value={createForm.name}
                    onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                    placeholder="Emergency Department Team"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="team-description">Description (optional)</Label>
                  <Textarea
                    id="team-description"
                    value={createForm.description}
                    onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                    placeholder="Brief description of the team's purpose..."
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setShowCreateDialog(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createTeamMutation.isPending || !createForm.name.trim()}>
                    {createTeamMutation.isPending ? "Creating..." : "Create Team"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog open={showJoinDialog} onOpenChange={setShowJoinDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" data-testid="button-join-existing-team">
                <LogIn className="h-4 w-4 mr-2" />
                Join Team
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Join Existing Team</DialogTitle>
                <DialogDescription>
                  Enter the 6-character group code shared by a team member.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleJoinTeam} className="space-y-4">
                <div>
                  <Label htmlFor="group-code">Group Code *</Label>
                  <Input
                    id="group-code"
                    value={joinForm.groupCode}
                    onChange={(e) => setJoinForm({ ...joinForm, groupCode: e.target.value.toUpperCase() })}
                    placeholder="ABC123"
                    maxLength={6}
                    className="uppercase text-center text-lg tracking-widest font-mono"
                    required
                  />
                  <p className="text-sm text-gray-600 mt-1">
                    6 characters: letters and numbers
                  </p>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setShowJoinDialog(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={joinTeamMutation.isPending || joinForm.groupCode.length !== 6}>
                    {joinTeamMutation.isPending ? "Joining..." : "Join Team"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {userTeams.map((userTeam) => (
          <Card 
            key={userTeam.teamId} 
            className="hover:shadow-md transition-shadow cursor-pointer" 
            data-testid={`card-team-${userTeam.teamId}`}
            onClick={() => handleTeamClick(userTeam.team.id)}
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{userTeam.team.name}</CardTitle>
                  {userTeam.team.description && (
                    <CardDescription className="mt-1">{userTeam.team.description}</CardDescription>
                  )}
                  <div className="mt-2 text-sm text-blue-600 font-medium">
                    Click to view team features →
                  </div>
                </div>
                <div className="flex items-center space-x-1">
                  {userTeam.role === 'admin' ? (
                    <Shield className="h-4 w-4 text-blue-500" />
                  ) : (
                    <User className="h-4 w-4 text-gray-500" />
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {/* Group Code */}
                <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div>
                    <p className="text-sm text-gray-600">Group Code</p>
                    <p className="font-mono text-lg font-bold text-blue-600">
                      {userTeam.team.groupCode}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      copyGroupCode(userTeam.team.groupCode);
                    }}
                    data-testid={`button-copy-${userTeam.team.groupCode}`}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>

                {/* Team Info */}
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <div className="flex items-center space-x-1">
                    <Users className="h-4 w-4" />
                    <span>{userTeam.team.maxMembers} max members</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Clock className="h-4 w-4" />
                    <span>
                      Expires {userTeam.team.expiresAt && formatDistanceToNow(new Date(userTeam.team.expiresAt), { addSuffix: true })}
                    </span>
                  </div>
                </div>

                <div className="text-sm text-gray-600">
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-4 w-4" />
                    <span>
                      Joined {userTeam.joinedAt && formatDistanceToNow(new Date(userTeam.joinedAt), { addSuffix: true })}
                    </span>
                  </div>
                </div>

                {/* Leave Team Button */}
                <div className="pt-3 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleLeaveTeam(userTeam.team.id, userTeam.team.name);
                    }}
                    disabled={leaveTeamMutation.isPending}
                    className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
                    data-testid={`button-leave-${userTeam.team.id}`}
                  >
                    {leaveTeamMutation.isPending ? "Leaving..." : "Leave Team"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
