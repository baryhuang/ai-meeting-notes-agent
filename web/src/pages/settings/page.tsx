import { useState, useMemo } from 'react';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  useBotConfig,
  useSaveConfig,
  useRestartBot,
  type ConfigItem,
} from '@/hooks/use-bot-config';

export function SettingsPage() {
  const { data, isLoading, error } = useBotConfig();
  const saveConfig = useSaveConfig();
  const restartBot = useRestartBot();
  const [edits, setEdits] = useState<Record<string, string>>({});

  // Group config items by their group field
  const groups = useMemo(() => {
    if (!data?.config) return {};
    const map: Record<string, ConfigItem[]> = {};
    for (const item of data.config) {
      if (!map[item.group]) map[item.group] = [];
      map[item.group].push(item);
    }
    return map;
  }, [data]);

  const hasChanges = Object.keys(edits).length > 0;

  function handleChange(key: string, value: string) {
    setEdits((prev) => {
      const next = { ...prev };
      if (value === '') {
        delete next[key];
      } else {
        next[key] = value;
      }
      return next;
    });
  }

  async function handleSave(andRestart = false) {
    if (!hasChanges) {
      toast.info('No changes to save');
      return;
    }
    try {
      await saveConfig.mutateAsync(edits);
      setEdits({});
      toast.success('Configuration saved');
      if (andRestart) {
        await restartBot.mutateAsync();
        toast.success('Bot is restarting...');
      }
    } catch (err) {
      toast.error(`Failed to save: ${err}`);
    }
  }

  if (isLoading) {
    return (
      <div className="container">
        <div className="p-5 text-muted-foreground">Loading configuration...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container">
        <div className="p-5 text-destructive">
          Failed to load configuration: {String(error)}
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="flex flex-col gap-5">
        <div>
          <h1 className="text-xl font-semibold">Settings</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage environment variables for the bot. Secret values are masked.
          </p>
        </div>

        {Object.entries(groups).map(([group, items]) => (
          <div
            key={group}
            className="rounded-lg border border-border bg-card p-5"
          >
            <h2 className="text-base font-semibold mb-4">{group}</h2>
            <div className="grid gap-4">
              {items.map((item) => (
                <div key={item.key} className="grid gap-1.5">
                  <label
                    htmlFor={item.key}
                    className="text-sm font-medium text-foreground"
                  >
                    {item.label}
                    {item.required && (
                      <span className="text-destructive ml-0.5">*</span>
                    )}
                    <span className="ml-2 text-xs text-muted-foreground font-mono">
                      {item.key}
                    </span>
                  </label>
                  <Input
                    id={item.key}
                    type={item.secret ? 'password' : 'text'}
                    placeholder={
                      item.secret
                        ? item.is_set
                          ? item.value
                          : item.default || 'Not set'
                        : item.default || 'Not set'
                    }
                    defaultValue={item.secret ? '' : item.value}
                    onChange={(e) => handleChange(item.key, e.target.value)}
                  />
                  {item.default && (
                    <span className="text-xs text-muted-foreground">
                      Default: {item.default}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}

        <div className="flex gap-3 pb-5">
          <Button
            onClick={() => handleSave(false)}
            disabled={!hasChanges || saveConfig.isPending}
          >
            {saveConfig.isPending ? 'Saving...' : 'Save'}
          </Button>
          <Button
            variant="outline"
            onClick={() => handleSave(true)}
            disabled={!hasChanges || saveConfig.isPending || restartBot.isPending}
          >
            {restartBot.isPending ? 'Restarting...' : 'Save & Restart'}
          </Button>
        </div>
      </div>
    </div>
  );
}
