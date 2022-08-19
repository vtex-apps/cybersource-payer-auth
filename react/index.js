import React, { Component, Fragment } from 'react'
import styles from './index.css'

class CybersourcePayerAuth extends Component {
  constructor(props) {
    super(props)
    this.formRef = React.createRef<HTMLFormElement>('payerAuth')
    this.state = {
      scriptLoaded: false,
      loading: false,
    }

    this.divContainer = React.createRef()
  }

  componentWillMount = () => {
    console.log('componentWillMount =>', JSON.stringify(this.props.appPayload))
    const { deviceDataCollectionUrl } = JSON.parse(this.props.appPayload)
    const { accessToken } = JSON.parse(this.props.appPayload)
    this.initiateDeviceDataCollection(deviceDataCollectionUrl, accessToken)
  }

  componentDidMount() {
    this.formRef.current && this.formRef.current.submit()
  }

  respondTransaction = status => {
    $(window).trigger('transactionValidation.vtex', [status])
  }

  handleOnLoad = () => {
    this.setState({ scriptLoaded: true })
  }

  onVerify = e => {
    const parsedPayload = JSON.parse(this.props.appPayload)
    this.setState({ loading: true })

    fetch(parsedPayload.approvePaymentUrl).then(() => {
      this.respondTransaction(true)
    })
  }

  cancelTransaction = () => {
    const parsedPayload = JSON.parse(this.props.appPayload)
    this.setState({ loading: true })

    fetch(parsedPayload.denyPaymentUrl).then(() => {
      this.respondTransaction(false)
    })
  }

  confirmTransation = () => {
    const parsedPayload = JSON.parse(this.props.appPayload)
    this.setState({ loading: true })

    fetch(parsedPayload.approvePaymentUrl).then(() => {
      this.respondTransaction(true)
    })
  }

  initiateDeviceDataCollection = (deviceDataCollectionUrl, accessToken) => {
    if (document.getElementById('cardinal_collection_iframe')) {
      return
    }

    var iframe = document.createElement('iframe')
    iframe.id = 'cardinal_collection_iframe'
    iframe.name = 'collectionIframe'
    iframe.height = '10'
    iframe.width = '10'
    iframe.style = '"display: none;'
    document.body.appendChild(iframe)
    
    const form = document.createElement('form')
    form.id = 'cardinal_collection_form'
    form.method = 'POST'
    form.target = 'collectionIframe'
    form.action = deviceDataCollectionUrl
    form.innerHTML = '<input id="cardinal_collection_form_input" type="hidden" name="JWT" value="' + accessToken + '"'
    document.body.appendChild(form)
  }

  injectScript = (id, src, onLoad) => {
    if (document.getElementById(id)) {
      return
    }

    const head = document.getElementsByTagName('head')[0]

    const js = document.createElement('script')
    js.id = id
    js.src = src
    js.async = true
    js.defer = true
    js.onload = onLoad

    head.appendChild(js)
  }

  render() {
    const { scriptLoaded, loading } = this.state

    return (
      "<script>window.onload = function() { " +
        "var cardinalCollectionForm = document.querySelector('#cardinal_collection_form'); " +
        "if(cardinalCollectionForm) // form exists " +
          "cardinalCollectionForm.submit(); " +
        "} " +
      "</script>"
    )
  }
}

export default CybersourcePayerAuth
