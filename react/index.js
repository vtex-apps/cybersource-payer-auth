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

  componentDidMount() {
    console.log('componentDidMount =>', JSON.stringify(this.props.appPayload))
    const { deviceDataCollectionUrl } = JSON.parse(this.props.appPayload)
    const { accessToken } = JSON.parse(this.props.appPayload)
    
    this.render(deviceDataCollectionUrl, accessToken)
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

  injectScript () {
    const head = document.getElementsByTagName('head')[0]

    const js = document.createElement('script')
    js.innerHTML = "window.onload = function() {" +
      "var cardinalCollectionForm = document.querySelector('#cardinal_collection_form');" +
      "if(cardinalCollectionForm) // form exists" +
      "cardinalCollectionForm.submit();" +
      "}"

    head.appendChild(js)
  }

  render = (deviceDataCollectionUrl, accessToken) => {
    const { scriptLoaded, loading } = this.state
    console.log('rendering...')
    return (
      "<iframe id='cardinal_collection_iframe' name='collectionIframe' height='10' width='10' style='display:none;'></iframe>" +
      "<form id='cardinal_collection_form' method='POST' target='collectionIframe' action=" + deviceDataCollectionUrl + ">" +
      "<input id='cardinal_collection_form_input' type='hidden' name='JWT' value=" + accessToken + "</form> " +
      "window.addEventListener('message', function(event) {" +
        "if (event.origin === https://centinelapistag.cardinalcommerce.com) {" +
        "console.log(event.data);" +
         "}" +
        "}, false);"
    )
  }
}

export default CybersourcePayerAuth
