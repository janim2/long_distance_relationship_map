export interface Memory {
  id: string;
  date: string;
  title: string;
  description: string;
  location: {
    lat: number;
    lng: number;
  };
  image?: string;
}

export interface Location {
  lat: number;
  lng: number;
  name: string;
  image?: string;
}

export interface StoredData {
  person1: Location;
  person2: Location;
  memories: Memory[];
}