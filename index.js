module.exports = function (options = {}) {
  if (!options.fromDirectory) {
    throw new Error('The fromDirectory field is undefined, transform need a main direction to watch.')
  }
  if (!options.toDirectory) {
    throw new Error('The toDirectory field is undefined, need it to transform the origin path.')
  }

  return {
    apply: doApply.bind(this, options)
  }
}

async function doApply({ fromDirectory, toDirectory }, resolver) {
  const fs = resolver.fileSystem

  let res = await statp(fs, fromDirectory)
  if (!res || !res.isDirectory()) {
    return
  }
  res = await statp(fs, toDirectory)
  if (!res || !res.isDirectory()) {
    return
  }

  resolver.plugin('after-described-relative', function (request, callback) {
    if (request.path.startsWith(toDirectory)) {
      request.doRelative = true
      const p = request.path.replace(toDirectory, fromDirectory)
      const obj = Object.assign({}, request, { path: p })
      return resolver.doResolve('described-relative', obj, `relative to mainDirectory ${p}`, callback)
    }
    callback()
  })

  resolver.plugin('before-existing-file', async function (request, callback) {
    if (request.doRelative) {
      return callback()
    }

    if (request.path.startsWith(fromDirectory)) {
      if (request.path.startsWith(toDirectory)) {
        return callback()
      }

      const p = request.path.replace(fromDirectory, toDirectory)
      const pStat = await statp(fs, p)
      if (pStat && pStat.isFile()) {
        var obj = Object.assign({}, request, { path: p })
        return resolver.doResolve('resolved', obj, null, callback)
      }
    }
    callback()
  })
}

function statp(fs, path) {
  return new Promise((resolve) => {
    fs.stat(path, function (err, stat) {
      if (!err && stat) {
        resolve(stat)
      } else {
        resolve(null)
      }
    })
  })
}
