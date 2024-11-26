import AddIntervenant from '@/components/crud/add';
import IntervenantsList from '@/components/crud/read';


export default function Dashboard() {
    return (
        <>
            <div className="flex flex-col gap-4">
                <AddIntervenant />
                <IntervenantsList />
            </div>
            <div className="flex flex-col gap-4">

            </div>
        </>
    );
}
