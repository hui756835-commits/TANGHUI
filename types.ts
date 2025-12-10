
export type Screen = 'splash' | 'input' | 'processing_plan' | 'luggage_selection' | 'packing_game' | 'summary';

export interface TravelPlan {
  description: string;
  category: string;
}

export interface LuggageItem {
  id: string;
  type: 'suitcase' | 'backpack' | 'handbag';
  size: number; // inches for suitcase, L for bags usually
  label: string;
}

export interface PackingItem {
  id: string;
  name: string;
  category: string;
  reason?: string;
  quantity: number;
}

export interface PackedItem extends PackingItem {
  status: 'packed' | 'later'; 
  containerId?: string; 
}

export interface AIPackingListResponse {
  weather: {
    summary: string; // e.g., "Hot and Humid"
    tempRange: string; // e.g., "25°C - 32°C"
    rainProb: string; // e.g., "High chance of afternoon showers"
  };
  destinationTips: string[]; // e.g., "Chongqing has many stairs, avoid large suitcases"
  luggageRecommendation: {
    packageName: string; // e.g., "Urban Light Travel Setup"
    items: { type: 'suitcase' | 'backpack' | 'handbag', size: number, reason: string }[];
    reason: string;
  };
  categories: {
    name: string;
    items: {
      name: string;
      reason: string;
      defaultQuantity: number;
    }[];
  }[];
}
