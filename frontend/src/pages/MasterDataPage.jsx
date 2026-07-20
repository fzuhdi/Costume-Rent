import MasterDataTab from '../components/MasterDataTab';

const MasterDataPage = () => {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold">Master Data</h1>
      <MasterDataTab />
    </div>
  );
};

export default MasterDataPage;
