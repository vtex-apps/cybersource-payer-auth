/* eslint-disable no-console */
import React, { Component } from 'react'
import { Modal } from 'vtex.styleguide'

interface CyberSourceAuthenticationProps {
  appPayload: string
}

declare const $: any
declare const vtex: any

class CybersourcePayerAuth extends Component<CyberSourceAuthenticationProps> {
  private formRef: React.RefObject<HTMLFormElement>
  private formRefStepUp: React.RefObject<HTMLFormElement>

  constructor(
    props:
      | CyberSourceAuthenticationProps
      | Readonly<CyberSourceAuthenticationProps>
  ) {
    super(props)
    this.formRef = React.createRef<HTMLFormElement>()
    this.formRefStepUp = React.createRef<HTMLFormElement>()
  }

  public state = {
    submitted: false,
    renderStepUp: false,
    height: '',
    width: '',
    stepUpUrl: '',
    stepUpAccessToken: '',
    createPaymentRequestReference: '',
  }

  public componentDidMount() {
    // console.log('componentDidMount =>', JSON.stringify(this.props.appPayload))
    if (this.state.submitted) {
      return
    }

    window.addEventListener(
      'message',
      async event => {
        if (
          event.origin !== 'https://centinelapistag.cardinalcommerce.com' &&
          event.origin !== 'https://centinelapi.cardinalcommerce.com'
        ) {
          return
        }

        const { createPaymentRequestReference } = JSON.parse(
          this.props.appPayload
        )

        this.setState({
          ...this.state,
          createPaymentRequestReference,
        })

        const payAuthRequest = await fetch(
          `/cybersource/payer-auth/${createPaymentRequestReference}`,
          {
            headers: {
              'Content-Type': 'application/json',
              Accept: 'application/json',
              'Cache-Control': 'no-cache',
            },
          }
        )

        const payAuthResponse = await payAuthRequest.json()

        if (
          payAuthResponse.status === 'AUTHENTICATION_SUCCESSFUL' ||
          payAuthResponse.status === 'AUTHORIZED'
        ) {
          this.respondTransaction(true)
        } else if (payAuthResponse.status === 'AUTHENTICATION_FAILED') {
          console.log(payAuthResponse.cardholderMessage) // Need to show this to the shopper
          this.respondTransaction(false)
        } else if (payAuthResponse.status === 'PENDING_AUTHENTICATION') {
          const dec = atob(
            payAuthResponse.consumerAuthenticationInformation.pareq
          )

          const decObj = JSON.parse(dec)

          this.renderStepUp(
            decObj.challengeWindowSize,
            payAuthResponse.consumerAuthenticationInformation.stepUpUrl,
            payAuthResponse.consumerAuthenticationInformation.accessToken
          )

          if (this.formRefStepUp.current) {
            this.formRefStepUp.current.submit()
            this.setState({ submitted: true })
          }

          const checkAuthStatus = setInterval(async () => {
            const authStatus = await fetch(
              `/cybersource/payer-auth/status/${createPaymentRequestReference}`,
              {
                headers: {
                  'Content-Type': 'application/json',
                  Accept: 'application/json',
                  'Cache-Control': 'no-cache',
                },
              }
            )

            const authStatusResponse = await authStatus.json()

            if (authStatusResponse === 'approved') {
              this.respondTransaction(true)
              clearInterval(checkAuthStatus)
            } else if (authStatusResponse === 'denied') {
              this.respondTransaction(false)
              clearInterval(checkAuthStatus)
            }
          }, 3000)
        } else {
          this.respondTransaction(false)
        }
      },
      false
    )

    if (this.formRef.current) {
      this.formRef.current.submit()
      this.setState({ submitted: true })
    }
  }

  public respondTransaction(status: boolean) {
    $(window).trigger('transactionValidation.vtex', [status])
  }

  public render() {
    const { deviceDataCollectionUrl, accessToken } = JSON.parse(
      this.props.appPayload
    )

    return (
      <>
        <iframe
          id="cardinal_collection_iframe"
          title="Cardinal Collection Iframe"
          name="collectionIframe"
          height="10"
          width="10"
          style={{ display: 'none' }}
        />
        <form
          ref={this.formRef}
          id="cardinal_collection_form"
          method="POST"
          target="collectionIframe"
          action={deviceDataCollectionUrl}
        >
          <input
            id="cardinal_collection_form_input"
            type="hidden"
            name="JWT"
            value={accessToken}
          />
        </form>
        {this.state.renderStepUp && (
          <Modal isOpen={true} showCloseIcon={false}>
            <iframe
              name="step-up-iframe"
              height={this.state.height}
              width={this.state.width}
            />
            <form
              ref={this.formRefStepUp}
              id="step-up-form"
              method="POST"
              target="step-up-iframe"
              action={this.state.stepUpUrl}
            >
              <input
                type="hidden"
                name="JWT"
                value={this.state.stepUpAccessToken}
              />
              <input
                type="hidden"
                name="MD"
                value={this.state.createPaymentRequestReference}
              />
            </form>
          </Modal>
        )}
      </>
    )
  }

  public renderStepUp(
    challengeWindowSize: string,
    stepUpUrl: string,
    accessToken: string
  ) {
    // Width x Height
    // 01 250 x 400
    // 02 390 x 400
    // 03 500 x 600
    // 04 600 x 400
    // 05 Full screen
    const widthArr = [250, 390, 500, 600, 1200]
    const heightArr = [400, 400, 600, 400, 800]
    let windowSize = +challengeWindowSize

    windowSize -= 1
    this.setState({
      ...this.state,
      height: heightArr[windowSize].toString(),
      width: widthArr[windowSize].toString(),
      stepUpUrl,
      stepUpAccessToken: accessToken,
      renderStepUp: true,
    })
    vtex.checkout.MessageUtils.hidePaymentMessage()
  }
}

export default CybersourcePayerAuth
