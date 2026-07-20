
import { Tabs, Card } from '@heroui/react';
import MasterDataTab from '../components/MasterDataTab';
import UserManagementTab from '../components/UserManagementTab';

const MasterDataPage = () => {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold">Master Data</h1>
      
      <Tabs aria-label="Master Data Options" color="primary" variant="underlined" defaultSelectedKey="attributes">
        <Tabs.ListContainer className="border-b border-default-200 w-full mb-4">
          <Tabs.List className="flex gap-6 w-full">
            <Tabs.Tab id="attributes">Kategori & Wilayah<Tabs.Indicator /></Tabs.Tab>
            <Tabs.Tab id="users">Manajemen Pengguna<Tabs.Indicator /></Tabs.Tab>
          </Tabs.List>
        </Tabs.ListContainer>
        
        <Tabs.Panel id="attributes" className="outline-none">
          <Card shadow="sm">
            <Card.Content>
              <MasterDataTab />
            </Card.Content>
          </Card>
        </Tabs.Panel>
        
        <Tabs.Panel id="users" className="outline-none">
          <Card shadow="sm">
            <Card.Content>
              <UserManagementTab />
            </Card.Content>
          </Card>
        </Tabs.Panel>
      </Tabs>
    </div>
  );
};

export default MasterDataPage;
