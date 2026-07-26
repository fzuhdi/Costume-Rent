import CostumeCard from '@/components/CostumeCard';

const CostumeCardView = ({ costumes }) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
      {costumes.map((costume) => (
        <CostumeCard key={costume.id} costume={costume} linkTo={`/admin/catalogue/${costume.id}`} />
      ))}
    </div>
  );
};

export default CostumeCardView;
