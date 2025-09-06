import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { LanguageToggle } from "@/components/language-toggle";
import { useTranslation } from 'react-i18next';

export default function SettingsPage() {
  const { t } = useTranslation();

  return (
    <div className="h-full flex flex-col">
      <div className="border-b border-gray-200 p-4 bg-white">
        <div className="mb-1">
          <h1 className="text-xl font-semibold tracking-tight">{t('settings.title')}</h1>
          <p className="text-muted-foreground text-xs">{t('settings.description')}</p>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4 max-w-5xl">
        <Card>
          <CardHeader>
            <CardTitle>{t('settings.appearance')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Theme, density, and layout controls will appear here.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{t('settings.shortcuts')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Keyboard shortcuts configuration coming soon.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{t('settings.privacy')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Control data handling and export options. No PHI is stored.</p>
          </CardContent>
        </Card>
        <LanguageToggle />
      </div>
    </div>
  );
}

