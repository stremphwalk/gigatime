import { useEffect, useMemo, useState } from "react";
import { useTranslation } from 'react-i18next';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Palette, Keyboard, Shield, Globe, User, Bell, Mic, Save, Moon, Sun, Monitor, Eye, EyeOff } from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import { useToast } from "@/hooks/use-toast";
import { LanguageToggle } from "@/components/language-toggle";

type SettingsState = {
  fontSize: "small" | "medium" | "large" | "extra-large";
  compactMode: boolean;
  showLineNumbers: boolean;
  wordWrap: boolean;
  shareUsageData: boolean;
  allowAnalytics: boolean;
  encryptNotes: boolean;
  autoLogout: boolean;
  autoLogoutTime: string;
  emailNotifications: boolean;
  pushNotifications: boolean;
  reminderNotifications: boolean;
  voiceLanguage: string;
  voiceSpeed: "slow" | "normal" | "fast";
  punctuationMode: "auto" | "off" | "strict";
  language: "en" | "fr";
  timezone: string;
  dateFormat: "MM/DD/YYYY" | "DD/MM/YYYY" | "YYYY-MM-DD";
  timeFormat: "12h" | "24h";
};

const keyboardShortcuts = [
  { action: "New Note", shortcut: "Ctrl+N", customizable: true },
  { action: "Save Note", shortcut: "Ctrl+S", customizable: false },
  { action: "Voice Dictation", shortcut: "Alt (Hold)", customizable: false },
  { action: "Smart Phrases", shortcut: "Ctrl+Shift+P", customizable: true },
  { action: "Search Notes", shortcut: "Ctrl+F", customizable: true },
  { action: "Quick Template", shortcut: "Ctrl+T", customizable: true },
  { action: "Medical Calculator", shortcut: "Ctrl+M", customizable: true },
  { action: "Insert Date/Time", shortcut: "Ctrl+D", customizable: true },
];

export default function SettingsPage() {
  const { t, i18n } = useTranslation();
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();

  const defaultSettings: SettingsState = useMemo(() => ({
    fontSize: "medium",
    compactMode: false,
    showLineNumbers: true,
    wordWrap: true,
    shareUsageData: true,
    allowAnalytics: false,
    encryptNotes: true,
    autoLogout: true,
    autoLogoutTime: "30",
    emailNotifications: true,
    pushNotifications: false,
    reminderNotifications: true,
    voiceLanguage: "en-US",
    voiceSpeed: "normal",
    punctuationMode: "auto",
    language: (i18n.language as "en" | "fr") || "en",
    timezone: "America/New_York",
    dateFormat: "MM/DD/YYYY",
    timeFormat: "12h",
  }), [i18n.language]);

  const [settings, setSettings] = useState<SettingsState>(defaultSettings);
  const [showApiKey, setShowApiKey] = useState(false);

  // Load saved settings from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem("arinote-settings-v1");
      if (raw) {
        const parsed = JSON.parse(raw);
        setSettings({ ...defaultSettings, ...parsed });
      }
    } catch {
      // ignore
    }
  }, [defaultSettings]);

  const handleSettingChange = (key: keyof SettingsState, value: any) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    try {
      localStorage.setItem("arinote-settings-v1", JSON.stringify(settings));
      toast({ title: t('success.saved'), description: t('settings.description') });
    } catch (e) {
      // no-op
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="border-b border-gray-200 p-4 bg-white dark:bg-gray-900">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">{t('settings.title')}</h1>
            <p className="text-muted-foreground text-xs">{t('settings.description')}</p>
          </div>
          <Button onClick={handleSave} data-testid="settings-save">
            <Save className="mr-2 h-4 w-4" />
            {t('common.save')}
          </Button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4 max-w-5xl">
        <Tabs defaultValue="appearance" className="space-y-4">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="appearance" className="flex items-center space-x-2">
              <Palette className="h-4 w-4" />
              <span className="hidden sm:inline">{t('settings.appearance')}</span>
            </TabsTrigger>
            <TabsTrigger value="shortcuts" className="flex items-center space-x-2">
              <Keyboard className="h-4 w-4" />
              <span className="hidden sm:inline">{t('settings.shortcuts')}</span>
            </TabsTrigger>
            <TabsTrigger value="privacy" className="flex items-center space-x-2">
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline">{t('settings.privacy')}</span>
            </TabsTrigger>
            <TabsTrigger value="language" className="flex items-center space-x-2">
              <Globe className="h-4 w-4" />
              <span className="hidden sm:inline">{t('settings.language')}</span>
            </TabsTrigger>
            <TabsTrigger value="account" className="flex items-center space-x-2">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">{t('settings.account')}</span>
            </TabsTrigger>
          </TabsList>

          {/* Appearance */}
          <TabsContent value="appearance" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Palette className="h-5 w-5" />
                  <span>Theme & Display</span>
                </CardTitle>
                <CardDescription>Customize the visual appearance of your workspace</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <Label>Theme</Label>
                  <div className="flex space-x-2">
                    <Button
                      variant={theme === "light" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setTheme("light")}
                      className="flex items-center space-x-2"
                    >
                      <Sun className="h-4 w-4" />
                      <span>Light</span>
                    </Button>
                    <Button
                      variant={theme === "dark" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setTheme("dark")}
                      className="flex items-center space-x-2"
                    >
                      <Moon className="h-4 w-4" />
                      <span>Dark</span>
                    </Button>
                    <Button
                      variant={theme === "system" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setTheme("system")}
                      className="flex items-center space-x-2"
                    >
                      <Monitor className="h-4 w-4" />
                      <span>System</span>
                    </Button>
                  </div>
                </div>

                <Separator />

                {/* Experiments: Unified Smart Phrase Overlay (beta) */}
                <div className="flex items-center justify-between rounded border p-3 bg-gray-50 dark:bg-gray-800/40">
                  <div className="space-y-0.5">
                    <Label>Unified Smart Phrase Overlay (beta)</Label>
                    <p className="text-sm text-muted-foreground">Enable the new chip-based overlay for smart phrases</p>
                  </div>
                  <Switch
                    checked={(() => {
                      try { return localStorage.getItem('arinote-unified-overlay') === '1'; } catch { return false; }
                    })()}
                    onCheckedChange={(checked) => {
                      try {
                        localStorage.setItem('arinote-unified-overlay', checked ? '1' : '0');
                      } catch {}
                    }}
                  />
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label htmlFor="font-size">Font Size</Label>
                    <Select value={settings.fontSize} onValueChange={(value) => handleSettingChange("fontSize", value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="small">Small</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="large">Large</SelectItem>
                        <SelectItem value="extra-large">Extra Large</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Compact Mode</Label>
                      <p className="text-sm text-muted-foreground">Reduce spacing for more content on screen</p>
                    </div>
                    <Switch
                      checked={settings.compactMode}
                      onCheckedChange={(checked) => handleSettingChange("compactMode", checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Show Line Numbers</Label>
                      <p className="text-sm text-muted-foreground">Display line numbers in note editor</p>
                    </div>
                    <Switch
                      checked={settings.showLineNumbers}
                      onCheckedChange={(checked) => handleSettingChange("showLineNumbers", checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Word Wrap</Label>
                      <p className="text-sm text-muted-foreground">Wrap long lines in editor</p>
                    </div>
                    <Switch
                      checked={settings.wordWrap}
                      onCheckedChange={(checked) => handleSettingChange("wordWrap", checked)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Shortcuts */}
          <TabsContent value="shortcuts" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Keyboard className="h-5 w-5" />
                  <span>Keyboard Shortcuts</span>
                </CardTitle>
                <CardDescription>Customize keyboard shortcuts for faster workflow</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {keyboardShortcuts.map((shortcut, index) => (
                    <div key={index} className="flex items-center justify-between py-2">
                      <div className="flex-1">
                        <Label className="font-medium">{shortcut.action}</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" className="font-mono">
                          {shortcut.shortcut}
                        </Badge>
                        {shortcut.customizable && (
                          <Button variant="ghost" size="sm">
                            Edit
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Mic className="h-5 w-5" />
                  <span>Voice Dictation</span>
                </CardTitle>
                <CardDescription>Configure voice recognition settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Voice Language</Label>
                    <Select
                      value={settings.voiceLanguage}
                      onValueChange={(value) => handleSettingChange("voiceLanguage", value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en-US">English (US)</SelectItem>
                        <SelectItem value="en-GB">English (UK)</SelectItem>
                        <SelectItem value="fr-FR">French</SelectItem>
                        <SelectItem value="de-DE">German</SelectItem>
                        <SelectItem value="es-ES">Spanish</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Speech Speed</Label>
                    <Select
                      value={settings.voiceSpeed}
                      onValueChange={(value) => handleSettingChange("voiceSpeed", value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="slow">Slow</SelectItem>
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="fast">Fast</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Privacy */}
          <TabsContent value="privacy" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="h-5 w-5" />
                  <span>Privacy & Security</span>
                </CardTitle>
                <CardDescription>Control your data privacy and security settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Share Usage Data</Label>
                      <p className="text-sm text-muted-foreground">Help improve Arinote by sharing anonymous usage data</p>
                    </div>
                    <Switch
                      checked={settings.shareUsageData}
                      onCheckedChange={(checked) => handleSettingChange("shareUsageData", checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Analytics</Label>
                      <p className="text-sm text-muted-foreground">Allow analytics tracking for feature usage</p>
                    </div>
                    <Switch
                      checked={settings.allowAnalytics}
                      onCheckedChange={(checked) => handleSettingChange("allowAnalytics", checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Encrypt Notes</Label>
                      <p className="text-sm text-muted-foreground">Enable end-to-end encryption for all notes</p>
                    </div>
                    <Switch
                      checked={settings.encryptNotes}
                      onCheckedChange={(checked) => handleSettingChange("encryptNotes", checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Auto Logout</Label>
                      <p className="text-sm text-muted-foreground">Automatically log out after period of inactivity</p>
                    </div>
                    <Switch
                      checked={settings.autoLogout}
                      onCheckedChange={(checked) => handleSettingChange("autoLogout", checked)}
                    />
                  </div>

                  {settings.autoLogout && (
                    <div className="ml-6 space-y-2">
                      <Label>Auto Logout Time (minutes)</Label>
                      <Input
                        type="number"
                        value={settings.autoLogoutTime}
                        onChange={(e) => handleSettingChange("autoLogoutTime", e.target.value)}
                        className="w-32"
                      />
                    </div>
                  )}
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">API Access</h3>
                  <div className="space-y-2">
                    <Label>API Key</Label>
                    <div className="flex space-x-2">
                      <Input
                        type={showApiKey ? "text" : "password"}
                        value="ak_1234567890abcdef"
                        readOnly
                        className="font-mono"
                      />
                      <Button variant="outline" size="sm" onClick={() => setShowApiKey(!showApiKey)}>
                        {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                      <Button variant="outline" size="sm">
                        Regenerate
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground">Use this API key to integrate with external applications</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Language */}
          <TabsContent value="language" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Globe className="h-5 w-5" />
                  <span>Language & Region</span>
                </CardTitle>
                <CardDescription>Configure language and regional preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <LanguageToggle />

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Timezone</Label>
                    <Select value={settings.timezone} onValueChange={(value) => handleSettingChange("timezone", value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="America/New_York">Eastern Time</SelectItem>
                        <SelectItem value="America/Chicago">Central Time</SelectItem>
                        <SelectItem value="America/Denver">Mountain Time</SelectItem>
                        <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                        <SelectItem value="Europe/London">GMT</SelectItem>
                        <SelectItem value="Europe/Paris">CET</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Date Format</Label>
                    <Select value={settings.dateFormat} onValueChange={(value) => handleSettingChange("dateFormat", value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                        <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                        <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Time Format</Label>
                    <Select value={settings.timeFormat} onValueChange={(value) => handleSettingChange("timeFormat", value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="12h">12 Hour</SelectItem>
                        <SelectItem value="24h">24 Hour</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Account */}
          <TabsContent value="account" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <User className="h-5 w-5" />
                  <span>Account Information</span>
                </CardTitle>
                <CardDescription>Manage your account details and preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Full Name</Label>
                    <Input defaultValue="Dr. Sarah Johnson" />
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input defaultValue="sarah.johnson@hospital.com" />
                  </div>
                  <div className="space-y-2">
                    <Label>Specialty</Label>
                    <Input defaultValue="Cardiology" />
                  </div>
                  <div className="space-y-2">
                    <Label>License Number</Label>
                    <Input defaultValue="MD123456" />
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="text-lg font-medium flex items-center space-x-2">
                    <Bell className="h-5 w-5" />
                    <span>{t('settings.notifications')}</span>
                  </h3>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Email Notifications</Label>
                        <p className="text-sm text-muted-foreground">Receive updates and reminders via email</p>
                      </div>
                      <Switch
                        checked={settings.emailNotifications}
                        onCheckedChange={(checked) => handleSettingChange("emailNotifications", checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Push Notifications</Label>
                        <p className="text-sm text-muted-foreground">Receive push notifications on mobile devices</p>
                      </div>
                      <Switch
                        checked={settings.pushNotifications}
                        onCheckedChange={(checked) => handleSettingChange("pushNotifications", checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Reminder Notifications</Label>
                        <p className="text-sm text-muted-foreground">Get reminders for follow-ups and tasks</p>
                      </div>
                      <Switch
                        checked={settings.reminderNotifications}
                        onCheckedChange={(checked) => handleSettingChange("reminderNotifications", checked)}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

