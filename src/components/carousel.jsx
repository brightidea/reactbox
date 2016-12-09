require('../../sass/carousel.sass')
import React from 'react'
import ReactDOM from 'react-dom'
import classnames from 'classnames'

import css from '../css'

function prefixStyles (styles) {
  Object.keys(styles).reduce((result, key)=> {
    const prefixes = prefixedKeys[key]
    if (prefixes) {
      result = prefixes.reduce((result, prefix)=> {
        result[`-${prefix}-${key}`] = styles[key]
        return result
      }, result)
    }
    return result
  } , {})
}

class Item extends React.Component {
  constructor (props) {
    super(props)
    this.state = {animated: false}
    this.onImageMounted = ::this.onImageMounted
    this.onClick = ::this.onClick
    this.onError = ::this.onError
    this.onLoad = ::this.onLoad
  }
  onLoad (e) {
    this.props.item.thumbnailSize = {width: e.target.naturalWidth,
      height: e.target.naturalHeight}
    this.props.dispatch('item.thumbnail.load', this.props.item).then(()=>
      this.setState({animated: true}))
  }
  onError (e) {
    this.props.dispatch('item.thumbnail.error', this.props.item).then(()=>
      this.setState({animated: true}))
  }
  onClick (e) {
    e.preventDefault();
    this.props.dispatch('item.thumbnail.click', this.props.item)
  }
  onImageMounted (image) {
    if (!image) {
      return
    }
    if (image.complete || this.props.item.thumbnailLoaded) {
      this.props.dispatch('item.thumbnail.load', this.props.item)
    }
  }
  componentWillUnmount () {
    this.props.item.thumbnailLoaded = false
  }
  render (props = this.props) {
    const imageStyle = css.camelize(
      css.prefix({transform: `translate(${props.left}px, 0)`}))
    return (
      <div className={classnames('reactbox-carousel-item', {
        'reactbox-active': props.item.index == props.activeIndex,
        'reactbox-loaded': props.item.thumbnailLoaded || props.item.thumbnailError,
        'reactbox-error': props.item.thumbnailError,
        'reactbox-animated': this.state.animated
        })}
        onClick={this.onClick}
        style={imageStyle}>
        <If condition={!props.item.error}>
            <img src={props.item.thumbnail}
              onLoad={this.onLoad}
              onError={this.onError}
              ref={this.onImageMounted}
              />
        </If>
        <If condition={props.item.error}>
          <i className="reactbox-icon-close" /></If>
      </div>
    )
  }
}

export default class Carousel extends React.Component {
  constructor (props) {
    super(props)
    this.state = {width: 0, height: 0}
    this.onWindowResize = ::this.onWindowResize
  }
  getWidth (item) {
    if (!item.thumbnail || item.thumbnailError){
      return 100
    }
    if (!item.thumbnailSize) {
      return 0
    }
    return this.state.height *
      item.thumbnailSize.width / item.thumbnailSize.height
  }
  getLeftForActive () { return  window.innerWidth / 2 -
    this.getWidth(this.props.items[this.props.activeIndex]) / 2 }
  componentDidMount () {
    this.updateSize()
    window.addEventListener('resize', this.onWindowResize)
  }
  componentWillUnmount () {
    window.removeEventListener('resize', this.onWindowResize) }
  onWindowResize (){ this.updateSize() }
  updateSize () {
    const node = ReactDOM.findDOMNode(this)
    this.setState({
      height: node.clientHeight,
      width: node.clientWidth
    })
  }
  render (props = this.props) {
    const current = props.items[props.activeIndex]
    let left = this.getLeftForActive()
    const visible = [{item: current, left: left}]
    if (current.index < this.props.items.length - 1){
      for (let i = current.index + 1; i < this.props.items.length; i++) {
        const item = props.items[i]
        left = left + this.getWidth(props.items[i - 1]) + 12
        visible.push({item: item, left: left})
        if (!(item.thumbnailSize &&
          (item.thumbnailLoaded || item.thumbnailError)) ||
          item.left > window.innerWidth * 1.5){
          break
        }
      }
    }
    left = this.getLeftForActive()
    if (current.index > 0  && (current.thumbnailLoaded || current.thumbnailError)){
      for (let i = current.index - 1; i >= 0; i--) {
        const item = this.props.items[i]
        left = left - (this.getWidth(this.props.items[i])) - 12
        visible.unshift({item: item, left: left})
        if (!(item.thumbnailSize && (item.thumbnailLoaded || item.thumbnailError)) ||
          item.left < - (window.innerWidth + this.getWidth(item))) {
          break
        }

      }
    }
    return (
      <div className="reactbox-carousel">
        <If condition={this.state.width && this.state.height}>
            {visible.map((item)=> {
              return (<Item {...props} item={item.item} key={item.item.index}
                left={item.left}/>)
            })}
        </If>
      </div>
    )
  }
}