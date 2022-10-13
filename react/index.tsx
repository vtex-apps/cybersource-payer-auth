/* eslint-disable no-console */
import React, { Component } from 'react'

interface CyberSourceAuthenticationProps {
  appPayload: string
}

declare const $: any

class CybersourcePayerAuth extends Component<CyberSourceAuthenticationProps> {
  private formRef: React.RefObject<HTMLFormElement>

  constructor(
    props:
      | CyberSourceAuthenticationProps
      | Readonly<CyberSourceAuthenticationProps>
  ) {
    super(props)
    this.formRef = React.createRef<HTMLFormElement>()
  }

  public state = {
    submitted: false,
  }

  public componentDidMount() {
    console.log('componentDidMount =>', JSON.stringify(this.props.appPayload))
    if (this.state.submitted) {
      return
    }

    window.addEventListener(
      'message',
      async event => {
        if (event.origin === 'https://centinelapistag.cardinalcommerce.com') {
          console.log(event.data)

          const { createPaymentRequestReference } = JSON.parse(
            this.props.appPayload
          )

          console.log(
            'createPaymentRequestReference',
            createPaymentRequestReference
          )

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

          console.log('payAuthResponse', payAuthResponse)
          console.log('payAuthResponse.status', payAuthResponse.status)
          if (payAuthResponse.status === 'AUTHENTICATION_SUCCESSFUL') {
            this.respondTransaction('true')
          } else if (payAuthResponse.status === 'AUTHENTICATION_FAILED') {
            console.log(payAuthResponse.cardholderMessage) // Need to show this to the shopper
            this.respondTransaction('false')
          } else if (payAuthResponse.status === 'PENDING_AUTHENTICATION') {
            console.log(
              'payAuthResponse.consumerAuthenticationInformation.accessToken',
              payAuthResponse.consumerAuthenticationInformation.accessToken
            )
            console.log(
              'payAuthResponse.consumerAuthenticationInformation.acsUrl',
              payAuthResponse.consumerAuthenticationInformation.acsUrl
            )
            console.log(
              'payAuthResponse.consumerAuthenticationInformation.stepUpUrl',
              payAuthResponse.consumerAuthenticationInformation.stepUpUrl
            )
            console.log(
              'payAuthResponse.consumerAuthenticationInformation.token',
              payAuthResponse.consumerAuthenticationInformation.token
            )
            const dec = atob(
              payAuthResponse.consumerAuthenticationInformation.pareq
            )

            const decObj = JSON.parse(dec)

            console.log('pareq', dec)
            this.renderStepUp(
              decObj.challengeWindowSize,
              payAuthResponse.consumerAuthenticationInformation.stepUpUrl,
              payAuthResponse.consumerAuthenticationInformation.accessToken
            )
          }
        }
      },
      false
    )

    if (this.formRef.current) {
      this.formRef.current.submit()
      this.setState({ submitted: true })
    }
  }

  public respondTransaction(status: string) {
    console.log('respondTransaction', status)
    $(window).trigger('transactionValidation.vtex', [status])
  }

  public render() {
    const { deviceDataCollectionUrl, accessToken } = JSON.parse(
      this.props.appPayload
    )

    console.log('rendering...')

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
      </>
    )
  }

  public renderStepUp(
    challengeWindowSize: string,
    stepUpUrl: string,
    accessToken: string
  ) {
    console.log('rendering step up...')
    // Width x Height
    // 01 250 x 400
    // 02 390 x 400
    // 03 500 x 600
    // 04 600 x 400
    // 05 Full screen
    const widthArr = [250, 390, 500, 600]
    const heightArr = [400, 400, 600, 400]
    let windowSize = +challengeWindowSize

    windowSize -= 1

    return (
      <>
        <iframe
          name="step-up-iframe"
          height={heightArr[windowSize]}
          width={widthArr[windowSize]}
        />
        <form
          ref={this.formRef}
          id="step-up-form"
          method="POST"
          target="step-up-iframe"
          action={stepUpUrl}
        >
          <input type="hidden" name="JWT" value={accessToken} />
        </form>
      </>
    )
  }
}

export default CybersourcePayerAuth
