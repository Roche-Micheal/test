const getServerStatus = (req, res) => {
  const wss = req.app.get('wss');
  wss.clients.forEach((client) => {
    if (client.readyState === 1 && client.userId === req.query?.userId) {
      client.send(JSON.stringify({
        type: 'payment-update',
        data: 'Payment successful',
      }));
      client.close(1000, 'Session expired');
    }
  });
  res.send({ status: 'Triggered WebSocket message' });
}

export { getServerStatus };