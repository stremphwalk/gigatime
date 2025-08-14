import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Users, 
  Plus, 
  MessageSquare, 
  Calendar,
  ClipboardList,
  User,
  Send,
  Clock
} from "lucide-react";

interface TeamMember {
  id: string;
  name: string;
  role: string;
  specialty: string;
  status: "online" | "offline" | "busy";
  initials: string;
}

interface TeamTodo {
  id: string;
  title: string;
  assignedTo: string;
  priority: "low" | "medium" | "high";
  dueDate: string;
  completed: boolean;
}

interface TeamEvent {
  id: string;
  title: string;
  date: string;
  time: string;
  type: "meeting" | "shift" | "conference" | "other";
}

export function TeamCollaboration() {
  const [selectedTeam] = useState("emergency-alpha");
  const [newTodo, setNewTodo] = useState<{ title: string; assignedTo: string; priority: "low" | "medium" | "high"; dueDate: string }>({ title: "", assignedTo: "", priority: "medium", dueDate: "" });
  const [newEvent, setNewEvent] = useState({ title: "", date: "", time: "", type: "meeting" as const });

  // Mock data - in real app would come from API
  const teamMembers: TeamMember[] = [
    { id: "1", name: "Dr. Jane Smith", role: "Lead", specialty: "Emergency Medicine", status: "online", initials: "JS" },
    { id: "2", name: "Dr. Mike Johnson", role: "Physician", specialty: "Internal Medicine", status: "online", initials: "MJ" },
    { id: "3", name: "Sarah Wilson", role: "Nurse", specialty: "Critical Care", status: "busy", initials: "SW" },
    { id: "4", name: "Dr. Lisa Chen", role: "Physician", specialty: "Cardiology", status: "online", initials: "LC" },
    { id: "5", name: "Tom Rodriguez", role: "Technician", specialty: "Radiology", status: "offline", initials: "TR" },
    { id: "6", name: "Dr. Amy Park", role: "Physician", specialty: "Neurology", status: "online", initials: "AP" }
  ];

  const [todos, setTodos] = useState<TeamTodo[]>([
    { id: "1", title: "Review patient charts for morning rounds", assignedTo: "Dr. Jane Smith", priority: "high", dueDate: "2025-08-15", completed: false },
    { id: "2", title: "Update medication protocols", assignedTo: "Sarah Wilson", priority: "medium", dueDate: "2025-08-16", completed: false },
    { id: "3", title: "Prepare case presentation", assignedTo: "Dr. Mike Johnson", priority: "low", dueDate: "2025-08-17", completed: true }
  ]);

  const [events] = useState<TeamEvent[]>([
    { id: "1", title: "Morning Rounds", date: "2025-08-15", time: "07:00", type: "meeting" },
    { id: "2", title: "Team Meeting", date: "2025-08-15", time: "14:00", type: "meeting" },
    { id: "3", title: "Night Shift Handover", date: "2025-08-15", time: "19:00", type: "shift" }
  ]);

  const addTodo = () => {
    if (newTodo.title && newTodo.assignedTo && newTodo.dueDate) {
      const todo: TeamTodo = {
        id: Date.now().toString(),
        ...newTodo,
        completed: false
      };
      setTodos([...todos, todo]);
      setNewTodo({ title: "", assignedTo: "", priority: "medium", dueDate: "" });
    }
  };

  const toggleTodo = (id: string) => {
    setTodos(todos.map(todo => 
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    ));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "online": return "bg-green-500";
      case "busy": return "bg-yellow-500";
      case "offline": return "bg-gray-400";
      default: return "bg-gray-400";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "bg-red-100 text-red-800";
      case "medium": return "bg-yellow-100 text-yellow-800";
      case "low": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-4">
      {/* Team Members */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Emergency Team Alpha</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            {teamMembers.map((member) => (
              <div 
                key={member.id} 
                className="flex items-center space-x-2 p-2 bg-gray-50 rounded hover:bg-gray-100 cursor-pointer"
                data-testid={`team-member-${member.id}`}
              >
                <div className="relative">
                  <Avatar className="w-6 h-6">
                    <AvatarFallback className="bg-medical-teal text-white text-xs">
                      {member.initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-white ${getStatusColor(member.status)}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium truncate">{member.name}</div>
                  <div className="text-xs text-gray-500 truncate">{member.specialty}</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Team Chat */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center">
            <MessageSquare size={14} className="mr-2" />
            Team Chat
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-32 overflow-y-auto mb-3">
            <div className="text-xs p-2 bg-blue-50 rounded">
              <div className="font-medium">Dr. Jane Smith</div>
              <div className="text-gray-600">Patient in room 204 needs immediate attention</div>
              <div className="text-gray-400 text-xs mt-1">2 min ago</div>
            </div>
            <div className="text-xs p-2 bg-gray-50 rounded">
              <div className="font-medium">Sarah Wilson</div>
              <div className="text-gray-600">Labs are ready for review</div>
              <div className="text-gray-400 text-xs mt-1">5 min ago</div>
            </div>
          </div>
          <div className="flex space-x-2">
            <Input placeholder="Type a message..." className="text-xs h-8" data-testid="input-team-chat" />
            <Button size="sm" className="bg-medical-teal hover:bg-medical-teal/90 px-3">
              <Send size={12} />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Team Todos */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium flex items-center">
              <ClipboardList size={14} className="mr-2" />
              Team Tasks
            </CardTitle>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                  <Plus size={12} />
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[400px]">
                <DialogHeader>
                  <DialogTitle>Add Team Task</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="todo-title" className="text-sm">Task Title</Label>
                    <Input
                      id="todo-title"
                      value={newTodo.title}
                      onChange={(e) => setNewTodo(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Enter task description"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="todo-assign" className="text-sm">Assign To</Label>
                    <Select value={newTodo.assignedTo} onValueChange={(value) => setNewTodo(prev => ({ ...prev, assignedTo: value }))}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select team member" />
                      </SelectTrigger>
                      <SelectContent>
                        {teamMembers.map(member => (
                          <SelectItem key={member.id} value={member.name}>
                            {member.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="todo-priority" className="text-sm">Priority</Label>
                      <Select value={newTodo.priority} onValueChange={(value: "low" | "medium" | "high") => setNewTodo(prev => ({ ...prev, priority: value }))}>
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="todo-date" className="text-sm">Due Date</Label>
                      <Input
                        id="todo-date"
                        type="date"
                        value={newTodo.dueDate}
                        onChange={(e) => setNewTodo(prev => ({ ...prev, dueDate: e.target.value }))}
                        className="mt-1"
                      />
                    </div>
                  </div>
                  <Button onClick={addTodo} className="w-full bg-medical-teal hover:bg-medical-teal/90">
                    Add Task
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {todos.map((todo) => (
              <div 
                key={todo.id} 
                className={`text-xs p-2 rounded border ${todo.completed ? 'bg-gray-50 opacity-60' : 'bg-white'}`}
                data-testid={`team-todo-${todo.id}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className={`font-medium ${todo.completed ? 'line-through' : ''}`}>
                      {todo.title}
                    </div>
                    <div className="text-gray-500 mt-1">
                      Assigned to: {todo.assignedTo}
                    </div>
                    <div className="flex items-center space-x-2 mt-1">
                      <Badge className={`text-xs ${getPriorityColor(todo.priority)}`}>
                        {todo.priority}
                      </Badge>
                      <span className="text-gray-400">Due: {new Date(todo.dueDate).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={() => toggleTodo(todo.id)}
                  >
                    <input 
                      type="checkbox" 
                      checked={todo.completed} 
                      onChange={() => toggleTodo(todo.id)}
                      className="w-3 h-3"
                    />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Team Calendar */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center">
            <Calendar size={14} className="mr-2" />
            Today's Schedule
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {events.map((event) => (
              <div 
                key={event.id} 
                className="text-xs p-2 bg-gray-50 rounded"
                data-testid={`team-event-${event.id}`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{event.title}</div>
                    <div className="text-gray-500 flex items-center space-x-2">
                      <Clock size={10} />
                      <span>{event.time}</span>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {event.type}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}