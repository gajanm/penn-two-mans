import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { currentUser } from "@/lib/mockData";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Camera } from "lucide-react";

export default function Settings() {
  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="font-heading font-bold text-3xl mb-2">Settings & Profile</h1>
        <p className="text-muted-foreground">Manage your account and preferences.</p>
      </div>

      {/* Profile Section */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-border">
        <h2 className="font-heading font-semibold text-xl mb-6">Public Profile</h2>
        
        <div className="flex items-center gap-6 mb-8">
          <div className="relative">
            <Avatar className="w-24 h-24 border-4 border-white shadow-md">
              <AvatarImage src={currentUser.avatar} />
              <AvatarFallback>SC</AvatarFallback>
            </Avatar>
            <button className="absolute bottom-0 right-0 p-2 bg-primary text-white rounded-full shadow-sm hover:bg-primary/90 transition-colors">
              <Camera className="w-4 h-4" />
            </button>
          </div>
          <div>
            <h3 className="font-bold text-lg">{currentUser.name}</h3>
            <p className="text-muted-foreground">sarah@upenn.edu</p>
          </div>
        </div>

        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Display Name</Label>
            <Input id="name" defaultValue={currentUser.name} className="rounded-xl" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="bio">Short Bio</Label>
            <Input id="bio" defaultValue="Loves coffee and exploring the city." className="rounded-xl" />
          </div>
        </div>
      </div>

      {/* Preferences */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-border">
        <h2 className="font-heading font-semibold text-xl mb-6">Matching Preferences</h2>
        
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">Same-Year Matching Only</Label>
              <p className="text-sm text-muted-foreground">Only match with students in your graduation year</p>
            </div>
            <Switch />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">Distance Radius</Label>
              <p className="text-sm text-muted-foreground">Limit matches to people living near campus</p>
            </div>
            <Switch defaultChecked />
          </div>
        </div>
      </div>

      {/* Notifications */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-border">
        <h2 className="font-heading font-semibold text-xl mb-6">Notifications</h2>
        
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">New Match Alerts</Label>
              <p className="text-sm text-muted-foreground">Get notified on Tuesday when matches drop</p>
            </div>
            <Switch defaultChecked />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">Chat Messages</Label>
              <p className="text-sm text-muted-foreground">Notifications for new group messages</p>
            </div>
            <Switch defaultChecked />
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-4">
         <Button variant="outline" className="rounded-full">Cancel</Button>
         <Button className="rounded-full bg-primary hover:bg-primary/90">Save Changes</Button>
      </div>
    </div>
  );
}
