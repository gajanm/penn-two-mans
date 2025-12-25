import React, { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { dateSpots } from "@/lib/mockData";
import { MapPin, DollarSign, Star } from "lucide-react";
import { DoubleCherries } from "@/components/ui/double-cherries";
import { cn } from "@/lib/utils";

export default function DateIdeas() {
  const [filter, setFilter] = useState("All");
  const filters = ["All", "Restaurant", "Activity", "Free", "Cozy"];

  const filteredSpots = dateSpots.filter(spot => {
    if (filter === "All") return true;
    if (filter === "Free") return spot.price === "Free";
    return spot.type === filter || spot.description.includes(filter);
  });

  return (
    <div className="space-y-8">
      <div className="text-center max-w-2xl mx-auto mb-12">
        <h1 className="font-heading font-bold text-3xl md:text-4xl mb-4">Curated Philly Date Spots</h1>
        <p className="text-muted-foreground text-lg">Hand-picked locations perfect for double dates. Vote on your favorites to share with the group.</p>
      </div>

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto pb-4 justify-center">
        {filters.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "px-6 py-2 rounded-full text-sm font-medium transition-all border",
              filter === f 
                ? "bg-primary text-white border-primary shadow-md shadow-primary/20" 
                : "bg-white text-foreground border-border hover:border-primary/50"
            )}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredSpots.map((spot, index) => (
          <DateCard key={spot.id} spot={spot} index={index} />
        ))}
      </div>
    </div>
  );
}

function DateCard({ spot, index }: { spot: any, index: number }) {
  const [voted, setVoted] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      <Card className="overflow-hidden border-none shadow-md hover:shadow-xl transition-all duration-300 group h-full flex flex-col bg-white">
        <div className="relative aspect-[4/3] overflow-hidden">
          <img 
            src={spot.image} 
            alt={spot.name} 
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
          <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-md px-2 py-1 rounded-md text-xs font-bold shadow-sm">
            {spot.price}
          </div>
          <div className="absolute bottom-3 left-3 bg-black/50 backdrop-blur-md text-white px-2 py-1 rounded-md text-xs font-medium flex items-center gap-1">
            <MapPin className="w-3 h-3" /> {spot.distance}
          </div>
        </div>
        
        <CardContent className="p-5 flex-1 flex flex-col">
          <div className="flex justify-between items-start mb-2">
            <div>
              <Badge variant="secondary" className="mb-2 bg-secondary/20 text-secondary-foreground hover:bg-secondary/20 border-none">
                {spot.type}
              </Badge>
              <h3 className="font-heading font-bold text-xl leading-tight">{spot.name}</h3>
            </div>
          </div>
          
          <p className="text-muted-foreground text-sm mb-6 flex-1">{spot.description}</p>
          
          <Button 
            onClick={() => setVoted(!voted)}
            className={cn(
              "w-full rounded-xl transition-all duration-300",
              voted 
                ? "bg-pink-100 text-pink-600 hover:bg-pink-200 shadow-inner" 
                : "bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20"
            )}
          >
            <DoubleCherries className="mr-2 w-4 h-4" />
            {voted ? "We'd love this!" : "Vote for this spot"}
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}
