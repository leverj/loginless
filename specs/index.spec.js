var expect    = require('expect.js')
var restjs    = require('rest.js')
var sinon     = require('sinon')
var bluebird  = require('bluebird')
var loginless = require('../src/index')
require('mocha-generators').install()

describe('Loginless', function() {
  var PRIVATE_KEY_WIF = 'cQhxRVxkBpTrwUHZmnv5M7ZvPcgp4cZ8csnenAfFLyoFgEVvN8yy'
  var PUBLIC_KEY_HEX = '02a40fd40b385908bafa7d172e7d43b4198715aa7aa50f179ff42ca2377e4caad7'
  var serverPublicKey = {serverPublicKey: '020a5a3a6450924a5571dfa52d00dc3f8d9917030d93d6b166a5784461bfb1e276'}
  it('Should register with server and obtain public key', function*() {
    var stub = sinon.stub(restjs, "post", function(uri, headers) {
      expect(headers.Authorization).to.be.ok()
      // expect(headers.Nonce).to.be.ok()
      return bluebird.resolve({body: serverPublicKey})
    })
    var ll = loginless('http://localhost', 'testnet')
    var meData = yield ll.registerKey(PRIVATE_KEY_WIF, '{reg: true}')
    ll.initPrivateKey(meData.serverPublicKey, PRIVATE_KEY_WIF)
    expect(ll.account.serverPublicKey).to.eql(serverPublicKey.serverPublicKey)
    stub.restore()
  })

  it('Should obtain pre-registered key from server', function*() {
    var stub = sinon.stub(restjs, "get", function(uri, headers) {
      return bluebird.resolve({body: serverPublicKey})
    })
    var ll = loginless('http://localhost', 'testnet')
    var meData = yield ll.getServerKey(PUBLIC_KEY_HEX)
    ll.initPrivateKey(meData.serverPublicKey, PRIVATE_KEY_WIF)
    expect(ll.account.serverPublicKey).to.eql(serverPublicKey.serverPublicKey)
    stub.restore()
  })

  it('Should be able to send Rest and Socket requests after getting server key', function*() {
    var spy = sinon.spy()
    var stub = sinon.stub(restjs, "get", function(uri, headers) {
      spy()
      return bluebird.resolve({body: serverPublicKey})
    })
    var ll = loginless('http://localhost', 'testnet')
    var meData = yield ll.getServerKey(PRIVATE_KEY_WIF)
    ll.initPrivateKey(meData.serverPublicKey, PRIVATE_KEY_WIF)
    var stub2 = sinon.stub(ll.socket, 'emit', function() {
      spy()
    })
    ll.socket.send({ method: "get", uri: "/" })
    yield ll.rest.get("/")
    expect(spy.callCount).to.be(3)
    stub.restore()
    stub2.restore()
  })
})
