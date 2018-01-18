const fakeFetch = jest.fn().mockImplementation(() =>
  Promise.resolve({
    json: function() {
      return Promise.resolve([{ id: 1, price: 450 }]);
    }
  })
);

module.exports = fakeFetch;
