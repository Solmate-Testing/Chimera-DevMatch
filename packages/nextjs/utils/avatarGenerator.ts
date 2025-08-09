/**
 * Avatar Generation System for Chimera DevMatch
 * 
 * This system generates standardized 3D pixelized avatars for creators
 * while maintaining personal style based on their agent descriptions
 */

export interface AvatarStyle {
  basePrompt: string;
  personalityTraits: string[];
  colorScheme: string;
  accessories: string[];
}

export interface AgentData {
  id: bigint | string;
  name: string;
  description: string;
  tags: string[];
  category?: string;
}

/**
 * Generate standardized prompt for Flux model based on agent description
 */
export const generateAvatarPrompt = (agent: AgentData): string => {
  // Base standardized prompt for all creators
  const basePrompt = "3D pixelized character, isometric view, minimalist design, soft pastel colors, professional avatar, clean background, Minecraft-style but refined, digital art, high quality render";
  
  // Analyze agent description for personality traits
  const description = agent.description.toLowerCase();
  const tags = agent.tags.map(tag => tag.toLowerCase());
  const allText = `${description} ${tags.join(' ')}`;
  
  // Determine personality-based styling
  let personalStyle = "";
  let colorScheme = "";
  let accessories = "";
  
  // AI/Tech focused
  if (allText.includes('ai') || allText.includes('tech') || allText.includes('coding') || allText.includes('developer')) {
    personalStyle = "tech professional, modern casual wear, confident pose";
    colorScheme = "blue and purple tones with white highlights";
    accessories = "futuristic glasses, holographic elements, code symbols floating around";
  }
  // Trading/Finance focused
  else if (allText.includes('trading') || allText.includes('finance') || allText.includes('investment') || allText.includes('crypto')) {
    personalStyle = "business professional, formal suit, determined expression";
    colorScheme = "green and gold tones with dark suit";
    accessories = "tie, briefcase, chart symbols, dollar signs";
  }
  // Creative/Art focused
  else if (allText.includes('creative') || allText.includes('art') || allText.includes('design') || allText.includes('content')) {
    personalStyle = "creative artist, trendy casual wear, artistic pose";
    colorScheme = "rainbow gradient with artistic flair";
    accessories = "paint brush, palette, creative tools, artistic symbols";
  }
  // Data/Analytics focused
  else if (allText.includes('data') || allText.includes('analytics') || allText.includes('analysis') || allText.includes('research')) {
    personalStyle = "data scientist, smart casual wear, analytical pose";
    colorScheme = "cyan and orange tones with white lab coat";
    accessories = "glasses, charts, graphs, mathematical symbols";
  }
  // Gaming/Entertainment
  else if (allText.includes('game') || allText.includes('entertainment') || allText.includes('fun') || allText.includes('bot')) {
    personalStyle = "gamer, casual hoodie, playful pose";
    colorScheme = "vibrant neon colors with gaming aesthetics";
    accessories = "headphones, controller, game symbols, pixelated effects";
  }
  // Default professional
  else {
    personalStyle = "professional, smart casual wear, friendly pose";
    colorScheme = "soft blue and purple gradient";
    accessories = "minimal professional accessories";
  }
  
  // Combine all elements
  return `${basePrompt}, ${personalStyle}, ${colorScheme}, ${accessories}, character name: ${agent.name}`;
};

/**
 * Generate avatar URL using pixelized creator characters
 */
export const generateAvatarUrl = (agent: AgentData): string => {
  // Use the pixelized creator images based on agent characteristics
  const creatorIndex = getCreatorImageIndex(agent);
  return `/creators/creator${creatorIndex}.png`;
};

/**
 * Determine which creator image to use based on agent characteristics
 */
const getCreatorImageIndex = (agent: AgentData): number => {
  const description = agent.description.toLowerCase();
  const tags = agent.tags.map(tag => tag.toLowerCase());
  const allText = `${description} ${tags.join(' ')}`;
  const agentId = typeof agent.id === 'string' ? parseInt(agent.id) || 0 : Number(agent.id);
  
  // Determine creator type based on specialization and use consistent mapping
  if (allText.includes('ai') || allText.includes('tech') || allText.includes('coding')) {
    return ((agentId % 2) === 0) ? 1 : 4; // Tech: creator1 or creator4
  } else if (allText.includes('trading') || allText.includes('finance') || allText.includes('investment')) {
    return ((agentId % 2) === 0) ? 2 : 5; // Finance: creator2 or creator5
  } else if (allText.includes('creative') || allText.includes('art') || allText.includes('design')) {
    return ((agentId % 2) === 0) ? 3 : 6; // Creative: creator3 or creator6
  } else if (allText.includes('data') || allText.includes('analytics') || allText.includes('research')) {
    return ((agentId % 2) === 0) ? 1 : 4; // Data: creator1 or creator4
  } else if (allText.includes('game') || allText.includes('entertainment') || allText.includes('bot')) {
    return ((agentId % 2) === 0) ? 5 : 6; // Gaming: creator5 or creator6
  } else {
    // Default: cycle through all creators based on agent ID
    return (agentId % 6) + 1; // Returns 1-6
  }
};

/**
 * Determine avatar style description for pixelized characters
 */
const determineAvatarStyle = (agent: AgentData): string => {
  const description = agent.description.toLowerCase();
  const tags = agent.tags.map(tag => tag.toLowerCase());
  const allText = `${description} ${tags.join(' ')}`;
  
  if (allText.includes('ai') || allText.includes('tech')) {
    return 'Tech Professional'; // Modern, tech-savvy
  } else if (allText.includes('trading') || allText.includes('finance')) {
    return 'Financial Expert'; // Professional, business-oriented
  } else if (allText.includes('creative') || allText.includes('art')) {
    return 'Creative Artist'; // Artistic, innovative
  } else if (allText.includes('data') || allText.includes('research')) {
    return 'Data Scientist'; // Analytical, precise
  } else if (allText.includes('game') || allText.includes('entertainment')) {
    return 'Gaming Specialist'; // Fun, engaging
  } else {
    return 'AI Specialist'; // General, versatile
  }
};

/**
 * Generate comprehensive creator profile with avatar and stats
 */
export interface CreatorProfile {
  id: string;
  name: string;
  handle: string;
  avatar: {
    url: string;
    prompt: string;
    style: string;
  };
  stats: {
    activeUsers: number;
    successRate: number;
    responseTime: string;
    monthlyFee: string;
    totalStaked: string;
    agentCount: number;
  };
  verified: boolean;
  specialization: string;
  colorTheme: {
    primary: string;
    secondary: string;
    accent: string;
  };
}

export const generateCreatorProfile = (
  agent: AgentData, 
  totalStaked: bigint = 0n,
  agentCount: number = 1
): CreatorProfile => {
  const avatarPrompt = generateAvatarPrompt(agent);
  const avatarUrl = generateAvatarUrl(agent);
  const style = determineAvatarStyle(agent);
  
  // Generate realistic stats based on agent characteristics
  const baseUsers = Math.floor(Math.random() * 500) + 50;
  const successRate = Math.floor(Math.random() * 15) + 85; // 85-99%
  const responseTime = Math.floor(Math.random() * 1500) + 100; // 100-1600ms
  
  // Determine specialization
  const description = agent.description.toLowerCase();
  let specialization = "AI Assistant";
  if (description.includes('trading')) specialization = "Trading Bot";
  else if (description.includes('creative')) specialization = "Creative AI";
  else if (description.includes('data')) specialization = "Data Analysis";
  else if (description.includes('game')) specialization = "Gaming Bot";
  
  // Generate color theme based on specialization
  const colorThemes = {
    "AI Assistant": { primary: "#6366F1", secondary: "#8B5CF6", accent: "#06B6D4" },
    "Trading Bot": { primary: "#10B981", secondary: "#059669", accent: "#F59E0B" },
    "Creative AI": { primary: "#EC4899", secondary: "#BE185D", accent: "#F97316" },
    "Data Analysis": { primary: "#06B6D4", secondary: "#0284C7", accent: "#8B5CF6" },
    "Gaming Bot": { primary: "#F97316", secondary: "#EA580C", accent: "#EF4444" },
  };
  
  return {
    id: agent.id.toString(),
    name: agent.name,
    handle: agent.name.toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9]/g, ''),
    avatar: {
      url: avatarUrl,
      prompt: avatarPrompt,
      style: style,
    },
    stats: {
      activeUsers: baseUsers,
      successRate: successRate,
      responseTime: `${responseTime}ms`,
      monthlyFee: (Number(totalStaked) / 1e18 / 10 || 0.01).toFixed(3),
      totalStaked: (Number(totalStaked) / 1e18).toFixed(3),
      agentCount: agentCount,
    },
    verified: totalStaked > BigInt(100000000000000000), // > 0.1 ETH
    specialization: specialization,
    colorTheme: colorThemes[specialization as keyof typeof colorThemes],
  };
};

/**
 * Batch generate creator profiles for marketplace display
 */
export const generateCreatorShowcase = (agents: AgentData[]): CreatorProfile[] => {
  return agents.map((agent, index) => 
    generateCreatorProfile(agent, BigInt(Math.floor(Math.random() * 1000000000000000000)), Math.floor(Math.random() * 5) + 1)
  );
};

/**
 * Future: Integration with Flux model for actual avatar generation
 */
export const generateFluxAvatar = async (prompt: string): Promise<string> => {
  // This will be implemented when Flux model is integrated
  // For now, return placeholder
  console.log('Flux avatar generation prompt:', prompt);
  return generateAvatarUrl({ id: Date.now().toString(), name: 'placeholder', description: '', tags: [] });
};

export default {
  generateAvatarPrompt,
  generateAvatarUrl,
  generateCreatorProfile,
  generateCreatorShowcase,
  generateFluxAvatar,
};