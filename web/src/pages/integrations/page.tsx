import {
  Toolbar,
  ToolbarDescription,
  ToolbarHeading,
  ToolbarPageTitle,
} from '@/components/layouts/layout-1/components/toolbar';

export function IntegrationsPage() {
  return (
    <div className="container">
      <Toolbar>
        <ToolbarHeading>
          <ToolbarPageTitle>Integrations</ToolbarPageTitle>
          <ToolbarDescription>
            Connect external services to pull meeting transcripts automatically
          </ToolbarDescription>
        </ToolbarHeading>
      </Toolbar>

      <p className="text-sm text-muted-foreground py-4 text-center">
        No integrations configured yet. Check back later.
      </p>
    </div>
  );
}
