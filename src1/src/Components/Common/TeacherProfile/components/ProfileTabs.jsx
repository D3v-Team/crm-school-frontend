// ProfileTabs.jsx
import React from 'react';
import { Tabs, TabsHeader, TabsBody, Tab, TabPanel } from '@material-tailwind/react';
import { BookOpen, GraduationCap, Users, CalendarDays, ListChecks } from 'lucide-react';
import SubjectsTab from './tabs/SubjectsTab';
import GroupsTab from './tabs/GroupsTab';
import ScheduleTab from './tabs/ScheduleTab';
import TopicsTab from './tabs/TopicsTab';

export default function ProfileTabs({ user, subjects }) {
  return (
    <Tabs value="subjects" className="w-full">
      <TabsHeader 
        className="bg-input-bg/50 rounded-xl p-1 overflow-x-auto"
        indicatorProps={{
          className: "bg-accent shadow-none rounded-lg",
        }}
      >
        <Tab 
          value="subjects" 
          className="text-text-primary data-[active=true]:text-white data-[active=true]:bg-accent/10 rounded-lg transition-all duration-200"
        >
          <BookOpen size={18} className="inline mr-1" /> Fanlar
        </Tab>
        <Tab 
          value="groups" 
          className="text-text-primary data-[active=true]:text-white data-[active=true]:bg-accent/10 rounded-lg transition-all duration-200"
        >
          <GraduationCap size={18} className="inline mr-1" /> Siniflar
        </Tab>
        <Tab 
          value="schedule" 
          className="text-text-primary data-[active=true]:text-white data-[active=true]:bg-accent/10 rounded-lg transition-all duration-200"
        >
          <CalendarDays size={18} className="inline mr-1" /> Jadvallar
        </Tab>
        <Tab 
          value="topics" 
          className="text-text-primary data-[active=true]:text-white data-[active=true]:bg-accent/10 rounded-lg transition-all duration-200"
        >
          <ListChecks size={18} className="inline mr-1" /> Mavzular
        </Tab>
      </TabsHeader>
      <TabsBody className="mt-4">
        <TabPanel value="subjects" className="p-0">
          <SubjectsTab
            subjectsList={subjects}
          />
        </TabPanel>
        <TabPanel value="groups" className="p-0">
          <GroupsTab user={user}   />
        </TabPanel>

        <TabPanel value="schedule" className="p-0">
          <ScheduleTab user={user} />
        </TabPanel>
        <TabPanel value="topics" className="p-0">
          <TopicsTab user={user}  />
        </TabPanel>
      </TabsBody>
    </Tabs>
  );
}