import { ALL_MOCK_AGENTS } from '../../../utils/mockAnalyticsData';
import AgentDetailClient from './client';

// Generate static params for all possible agent IDs
export function generateStaticParams() {
  // Generate params for all mock agents
  const agentIds = ALL_MOCK_AGENTS.map((agent: any) => ({
    id: agent.id.toString()
  }));
  
  // Add some additional IDs for potential new agents (1-50)
  const additionalIds = Array.from({ length: 50 }, (_, i) => ({ 
    id: (i + 1).toString() 
  }));
  
  // Combine and deduplicate
  const allIds = [...agentIds, ...additionalIds];
  const uniqueIds = allIds.filter((item, index, self) => 
    index === self.findIndex((t) => t.id === item.id)
  );
  
  console.log(`📊 Generated ${uniqueIds.length} static params for agent pages`);
  return uniqueIds;
}

interface PageProps {
  params: {
    id: string;
  };
}

export default function AgentDetailPage({ params }: PageProps) {
  return <AgentDetailClient params={params} />;
}