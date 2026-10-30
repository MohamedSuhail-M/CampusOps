const http = require('http');

async function testEvidence() {
  console.log('Testing Photo Evidence Upload & Retrieval...');

  // 1. Student login
  const loginPayload = JSON.stringify({ loginId: 'campus001', password: 'password123', requestedRole: 'STUDENT' });
  const loginRes = await makeRequest('POST', '/api/auth/login', loginPayload, { 'Content-Type': 'application/json' });
  const cookie = loginRes.headers['set-cookie'][0];

  // 2. Prepare multipart body with a small 1x1 dummy PNG
  const boundary = '----CampusOpsBoundary' + Date.now();
  const dummyPng = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64');
  
  const bodyHeader = `--${boundary}\r\nContent-Disposition: form-data; name="photos"; filename="sample_socket.png"\r\nContent-Type: image/png\r\n\r\n`;
  const bodyFooter = `\r\n--${boundary}--\r\n`;
  
  const payload = Buffer.concat([
    Buffer.from(bodyHeader, 'utf8'),
    dummyPng,
    Buffer.from(bodyFooter, 'utf8')
  ]);

  const uploadRes = await makeRequest('POST', '/api/intake/evidence', payload, {
    'Content-Type': `multipart/form-data; boundary=${boundary}`,
    'Cookie': cookie
  });

  const uploadData = JSON.parse(uploadRes.body);
  console.log('1. Photo upload (/api/intake/evidence):', uploadRes.statusCode === 201 ? 'SUCCESS' : 'FAILED',
    'Uploaded IDs:', uploadData.data?.map(e => e.id)
  );

  if (uploadData.data?.[0]?.id) {
    const evidenceId = uploadData.data[0].id;
    const fetchRes = await makeRequest('GET', '/api/intake/evidence/' + evidenceId, null, {
      'Cookie': cookie
    });
    console.log('2. Photo fetch (/api/intake/evidence/:id):', fetchRes.statusCode === 200 ? 'SUCCESS' : 'FAILED',
      'Content-Type:', fetchRes.headers['content-type'],
      'Bytes received:', fetchRes.body.length
    );
  }
}

function makeRequest(method, path, body, headers = {}) {
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: 'localhost',
      port: 4000,
      path,
      method,
      headers: {
        ...headers,
        ...(body ? { 'Content-Length': Buffer.isBuffer(body) ? body.length : Buffer.byteLength(body) } : {})
      }
    }, (res) => {
      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => resolve({
        statusCode: res.statusCode,
        headers: res.headers,
        body: Buffer.concat(chunks)
      }));
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

testEvidence().catch(console.error);
