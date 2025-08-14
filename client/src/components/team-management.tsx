import { useState } from "react";
import { useTeams, useCreateTeam, useJoinTeam, useLeaveTeam } from "@/hooks/use-teams";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Users, Plus, LogIn, Copy, Calendar, Clock, Shield, User } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export function TeamManagement() {
  const { data: userTeams = [], isLoading } = useTeams();
  const { toast } = useToast();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showJoinDialog, setShowJoinDialog] = useState(false);

  const createTeamMutation = useCreateTeam();
  const joinTeamMutation = useJoinTeam();
  const leaveTeamMutation = useLeaveTeam();

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
                  Create a team to collaborate with up to 6 members. Teams automatically disband after 7 days.
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
                    Enter a 4-character group code to join an existing team
                  </CardDescription>
                </CardContent>
              </Card>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Join Existing Team</DialogTitle>
                <DialogDescription>
                  Enter the 4-character group code shared by a team member.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleJoinTeam} className="space-y-4">
                <div>
                  <Label htmlFor="group-code">Group Code *</Label>
                  <Input
                    id="group-code"
                    value={joinForm.groupCode}
                    onChange={(e) => setJoinForm({ ...joinForm, groupCode: e.target.value.toUpperCase() })}
                    placeholder="ABC1"
                    maxLength={4}
                    className="uppercase text-center text-lg tracking-widest font-mono"
                    required
                    data-testid="input-group-code"
                  />
                  <p className="text-sm text-gray-600 mt-1">
                    4 characters: letters and numbers
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
                    disabled={joinTeamMutation.isPending || joinForm.groupCode.length !== 4}
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
                  Create a team to collaborate with up to 6 members. Teams automatically disband after 7 days.
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
                  Enter the 4-character group code shared by a team member.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleJoinTeam} className="space-y-4">
                <div>
                  <Label htmlFor="group-code">Group Code *</Label>
                  <Input
                    id="group-code"
                    value={joinForm.groupCode}
                    onChange={(e) => setJoinForm({ ...joinForm, groupCode: e.target.value.toUpperCase() })}
                    placeholder="ABC1"
                    maxLength={4}
                    className="uppercase text-center text-lg tracking-widest font-mono"
                    required
                  />
                  <p className="text-sm text-gray-600 mt-1">
                    4 characters: letters and numbers
                  </p>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setShowJoinDialog(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={joinTeamMutation.isPending || joinForm.groupCode.length !== 4}>
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
          <Card key={userTeam.teamId} className="hover:shadow-md transition-shadow" data-testid={`card-team-${userTeam.teamId}`}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{userTeam.team.name}</CardTitle>
                  {userTeam.team.description && (
                    <CardDescription className="mt-1">{userTeam.team.description}</CardDescription>
                  )}
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
                    onClick={() => copyGroupCode(userTeam.team.groupCode)}
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
                    onClick={() => handleLeaveTeam(userTeam.team.id, userTeam.team.name)}
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