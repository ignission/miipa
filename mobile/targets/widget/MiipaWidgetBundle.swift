import WidgetKit
import SwiftUI

@main
struct MiipaWidgetBundle: WidgetBundle {
    var body: some Widget {
        MiipaSmallWidget()
        MiipaMediumWidget()
        MiipaLargeWidget()
    }
}
