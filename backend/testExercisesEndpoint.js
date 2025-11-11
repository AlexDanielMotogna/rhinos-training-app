import jwt from 'jsonwebtoken';

// Generate a test token
const token = jwt.sign(
  { userId: '68ffc158a21f925368a9ccea', email: 'alexdanielmotogna@gmail.com', role: 'player' },
  'your-super-secret-jwt-key-change-this-in-production-min-32-chars'
);

// Make request
fetch('http://localhost:5000/api/exercises', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
})
  .then(res => res.json())
  .then(data => {
    console.log(`Total exercises: ${data.length}`);
    if (data.length > 0) {
      console.log('First exercise:', JSON.stringify(data[0], null, 2));
      const withLegs = data.filter(e => e.muscleGroups?.includes('legs'));
      console.log(`Exercises with 'legs': ${withLegs.length}`);
    }
  })
  .catch(err => console.error('Error:', err));
