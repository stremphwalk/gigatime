import { useTranslation } from 'react-i18next';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useEffect } from 'react';
import { usePreferences } from '@/hooks/use-preferences';
import { useSimpleAuth } from '@/hooks/useSimpleAuth';

const languages = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
];

export function LanguageToggle() {
  const { i18n, t } = useTranslation();
  const { prefs, updateLanguage } = usePreferences();
  const [currentLanguage, setCurrentLanguage] = useState(i18n.language);

  useEffect(() => {
    // Initialize language from user preferences or i18n default
    const initialLanguage = prefs.language || i18n.language;
    if (initialLanguage !== i18n.language) {
      i18n.changeLanguage(initialLanguage);
    }
    setCurrentLanguage(initialLanguage);
  }, [prefs.language, i18n]);

  useEffect(() => {
    const handleLanguageChange = (lng: string) => {
      setCurrentLanguage(lng);
    };

    i18n.on('languageChanged', handleLanguageChange);
    return () => {
      i18n.off('languageChanged', handleLanguageChange);
    };
  }, [i18n]);

  const handleLanguageChange = (languageCode: string) => {
    i18n.changeLanguage(languageCode);
    setCurrentLanguage(languageCode);
    updateLanguage(languageCode as 'en' | 'fr');
  };

  const currentLangInfo = languages.find(lang => lang.code === currentLanguage) || languages[0];

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('settings.language')}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <Label htmlFor="language-select">{t('settings.language')}</Label>
          <Select value={currentLanguage} onValueChange={handleLanguageChange}>
            <SelectTrigger id="language-select">
              <SelectValue>
                <div className="flex items-center gap-2">
                  <span>{currentLangInfo.flag}</span>
                  <span>{currentLangInfo.name}</span>
                </div>
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {languages.map((language) => (
                <SelectItem key={language.code} value={language.code}>
                  <div className="flex items-center gap-2">
                    <span>{language.flag}</span>
                    <span>{language.name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-sm text-muted-foreground">
            {t('settings.language')} selection will be saved automatically.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
