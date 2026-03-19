

async function test() {
    // 1. login 
    const loginRes = await fetch('http://localhost:4000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'agent@cpre.com', password: 'password123' })
    });
    const loginData = await loginRes.json();
    const token = loginData.token;

    console.log("Token:", token);

    // 2. create property
    const propRes = await fetch('http://localhost:4000/api/properties', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
            address: '703 Room 36-16 Main St',
            city: 'New York',
            state: 'NY',
            zip: '11355',
            price: '1400000',
            beds: '4',
            baths: '1',
            sqft: '5000',
            status: 'COMING_SOON'
        })
    });

    console.log("Status:", propRes.status);
    const propData = await propRes.text();
    console.log("Response:", propData);
}

test();
