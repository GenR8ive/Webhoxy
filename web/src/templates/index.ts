// Import all template JSON files
import slackTemplate from './slack.json';
import discordTemplate from './discord.json';
import teamsTemplate from './teams.json';
import telegramTemplate from './telegram.json';

export interface ServiceTemplate {
  name: string;
  description: string;
  icon: string;
  examplePayload: Record<string, any>;
}

// Export all templates
export const templates: ServiceTemplate[] = [
  slackTemplate,
  discordTemplate,
  teamsTemplate,
  telegramTemplate,
];

// Export individual templates
export { slackTemplate, discordTemplate, teamsTemplate, telegramTemplate };

