import { useEffect,useState } from 'react'


function App() {
  const [plant, setPlant] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('http://localhost:8000/plants')
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP error: ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        console.log("Plants loaded:", data);
        setPlant(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching plant data:', err);
        setLoading(false);
      });
  }, []);
 

  return (
    <div className="min-h-screen bg-gray-50 p-6 text-gray-900">
      <div className='mx-auto max-w-6xl'>
        <h1 className='text-3xl font-bold'>Plante Palette Tool</h1>
        <p className='mt-2 text-sm text-gray-600'>
          Version 1 mock plant results
        </p>





        {loading ? (
          <p className='mt-6 text-gray-500'>Loading plant ...</p>
        ) : (
          <div className='mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'>
            {plant.map((plant) => (
              <div
                key={plant.id}
                className='overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm'
              >
                <img
                  src={plant.image_url}
                  alt={plant.common_name}
                  className='h-40 w-full object-cover'
                />
                <div className='p-4'>
                  <h3 className='text-lg font-semibold'>{plant.common_name}</h3>
                  <p className='text-sm italic text-gray-500'>
                    {plant.botanical_name}
                  </p>

                  <div className='mt-3 space-y-1 text-sm text-gray-700'>
                    <p>Type: {plant.plant_type}</p>
                    <p>Flower Color:{plant.flower_color}</p>
                    <p>Height:{plant.height}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
